import os
import json
import re
import math
from collections import Counter
from typing import List, Dict, Any, Tuple, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.auth import get_current_worker
from app.models.models import Worker, RAGDocument
from app.schemas.schemas import RAGQuery, RAGResponse
from app.services.openrouter import chat_completion
from app.config import settings

router = APIRouter()

# ── 1. Load 17 Contextual WHO/ICDS/POSHAN Guidelines ─────────────────────────
KB_FILE = os.path.join(os.path.dirname(__file__), "..", "contextual_kb.json")

def _load_knowledge_base() -> List[Dict[str, Any]]:
    if os.path.exists(KB_FILE):
        try:
            with open(KB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Fallback with contextual text
    return [
        {
            "id": "doc_0",
            "source": "WHO Child Growth Standards — MUAC",
            "context": "Official WHO and ICDS screening guidelines for assessing acute malnutrition using Mid-Upper Arm Circumference (MUAC).",
            "content": "MUAC < 11.5 cm = SAM (Severe Acute Malnutrition). MUAC 11.5–12.5 cm = MAM (Moderate Acute Malnutrition). MUAC >= 12.5 cm = Normal. SAM children require immediate therapeutic feeding and PHC referral.",
            "keywords": ["muac", "sam", "mam", "malnutrition", "severe", "moderate", "कुपोषण", "दंड", "दंडघेर", "माप", "सॅम", "मॅम"],
            "contextualized_text": "Context: Official WHO and ICDS screening guidelines for assessing acute malnutrition using Mid-Upper Arm Circumference (MUAC).\nDocument: WHO Child Growth Standards — MUAC\nContent: MUAC < 11.5 cm = SAM (Severe Acute Malnutrition). MUAC 11.5–12.5 cm = MAM (Moderate Acute Malnutrition). MUAC >= 12.5 cm = Normal. SAM children require immediate therapeutic feeding and PHC referral."
        },
        {
            "id": "doc_1",
            "source": "WHO Weight-for-Age Z-Score",
            "context": "WHO Child Growth Standards for evaluating underweight status using Weight-for-Age Z-scores (WAZ).",
            "content": "WAZ < -3 SD = Severely Underweight (SAM). WAZ -3 to -2 SD = Underweight (MAM). WAZ > -2 SD = Normal. Monthly weighing is mandatory for all children 0–60 months.",
            "keywords": ["weight", "waz", "z-score", "underweight", "वजन", "zscore", "कमी वजन", "वजन वाढ"],
            "contextualized_text": "Context: WHO Child Growth Standards for evaluating underweight status using Weight-for-Age Z-scores (WAZ).\nDocument: WHO Weight-for-Age Z-Score\nContent: WAZ < -3 SD = Severely Underweight (SAM). WAZ -3 to -2 SD = Underweight (MAM). WAZ > -2 SD = Normal. Monthly weighing is mandatory for all children 0–60 months."
        }
    ]

KNOWLEDGE_BASE = _load_knowledge_base()

STOP_WORDS = {
    "the", "is", "in", "of", "and", "a", "an", "to", "for", "on", "with", "as", "by", "at", "from", "or",
    "what", "how", "why", "when", "where", "which", "who", "whom", "this", "that", "these", "those",
    "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could",
    "should", "would", "will", "shall", "may", "might", "must", "today", "day",
    "का", "के", "की", "में", "से", "को", "पर", "है", "हैं", "था", "थी", "थे", "हो", "होता", "होती", "होते",
    "किया", "किए", "गया", "गई", "गए", "और", "या", "एक", "यह", "वह", "क्या", "कैसे", "कब", "कहाँ",
    "चे", "च्या", "ची", "मध्ये", "आणि", "किंवा", "आहे", "आहेत", "होते", "केले", "गेले", "काय", "कसे", "केव्हा", "कुठे"
}

# ── 2. Lightweight In-Memory Multilingual BM25 Engine ────────────────────────
class MultilingualBM25:
    def __init__(self, corpus: List[Dict[str, Any]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.doc_lengths = []
        self.doc_freqs = []
        self.nd = Counter()
        
        for doc in corpus:
            full_text = f"{doc.get('context', '')} {doc['source']} {doc['content']} {' '.join(doc.get('keywords', []))}"
            tokens = self._tokenize(full_text)
            self.doc_lengths.append(len(tokens))
            freq = Counter(tokens)
            self.doc_freqs.append(freq)
            for token in freq:
                self.nd[token] += 1
                
        self.avg_doc_len = sum(self.doc_lengths) / self.corpus_size if self.corpus_size > 0 else 1.0
        self.idf = {
            t: math.log(1 + (self.corpus_size - freq + 0.5) / (freq + 0.5))
            for t, freq in self.nd.items()
        }

    def _tokenize(self, text: str) -> List[str]:
        # Supports Devanagari script, English alphanumeric, and digits (filters stop words)
        tokens = re.findall(r'[\w\u0900-\u097F]+', text.lower())
        return [t for t in tokens if len(t) > 1 and t not in STOP_WORDS]

    def score(self, query: str) -> List[float]:
        query_tokens = self._tokenize(query)
        scores = [0.0] * self.corpus_size
        for token in query_tokens:
            if token not in self.idf:
                continue
            idf_val = self.idf[token]
            for idx, doc_freq in enumerate(self.doc_freqs):
                if token in doc_freq:
                    tf = doc_freq[token]
                    doc_len = self.doc_lengths[idx]
                    denom = tf + self.k1 * (1 - self.b + self.b * (doc_len / self.avg_doc_len))
                    scores[idx] += idf_val * (tf * (self.k1 + 1)) / denom
        return scores

# ── 2. Lightweight In-Memory Multilingual BM25 Engine ────────────────────────
class MultilingualBM25:
    def __init__(self, corpus: List[Dict[str, Any]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.doc_lengths = []
        self.doc_freqs = []
        self.nd = Counter()
        
        for doc in corpus:
            full_text = f"{doc.get('context', '')} {doc['source']} {doc['content']} {' '.join(doc.get('keywords', []))}"
            tokens = self._tokenize(full_text)
            self.doc_lengths.append(len(tokens))
            freq = Counter(tokens)
            self.doc_freqs.append(freq)
            for token in freq:
                self.nd[token] += 1
                
        self.avg_doc_len = sum(self.doc_lengths) / self.corpus_size if self.corpus_size > 0 else 1.0
        self.idf = {
            t: math.log(1 + (self.corpus_size - freq + 0.5) / (freq + 0.5))
            for t, freq in self.nd.items()
        }

    def _tokenize(self, text: str) -> List[str]:
        # Supports Devanagari script, English alphanumeric, and digits (filters stop words)
        tokens = re.findall(r'[\w\u0900-\u097F]+', text.lower())
        return [t for t in tokens if len(t) > 1 and t not in STOP_WORDS]

    def score(self, query: str) -> List[float]:
        query_tokens = self._tokenize(query)
        scores = [0.0] * self.corpus_size
        for token in query_tokens:
            if token not in self.idf:
                continue
            idf_val = self.idf[token]
            for idx, doc_freq in enumerate(self.doc_freqs):
                if token in doc_freq:
                    tf = doc_freq[token]
                    doc_len = self.doc_lengths[idx]
                    denom = tf + self.k1 * (1 - self.b + self.b * (doc_len / self.avg_doc_len))
                    scores[idx] += idf_val * (tf * (self.k1 + 1)) / denom
        return scores

bm25_engine = MultilingualBM25(KNOWLEDGE_BASE)

# ── 3. Embedding Model Loader ────────────────────────────────────────────────
_embedding_model = None

def get_embedding_model():
    """Lazy loader for sentence-transformers embedding model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        except Exception as e:
            print(f"Warning: Could not load embedding model {settings.EMBEDDING_MODEL}: {e}")
            return None
    return _embedding_model

# ── 4. Hybrid Contextual Retrieval Strategy ──────────────────────────────────
def _retrieve_contextual_docs(
    question: str,
    db: Optional[Session] = None,
    top_k: int = 3
) -> Tuple[List[Dict[str, Any]], float, float]:
    """
    Returns (relevant_documents, max_dense_similarity, max_bm25_score)
    Queries Supabase Postgres using pgvector for dense similarity, combined with BM25.
    """
    bm25_scores = bm25_engine.score(question)
    max_bm25 = max(bm25_scores) if bm25_scores else 0.0
    
    # Try Supabase pgvector with multilingual-e5-small
    model = get_embedding_model()
    if model is not None:
        try:
            e5_query = f"query: {question}"
            query_vec = model.encode(e5_query).tolist()

            local_db = db or SessionLocal()
            try:
                # Query RAGDocument in Supabase Postgres using cosine distance
                results = local_db.query(
                    RAGDocument,
                    (1.0 - RAGDocument.embedding.cosine_distance(query_vec)).label("similarity")
                ).filter(
                    RAGDocument.embedding.isnot(None)
                ).order_by(
                    RAGDocument.embedding.cosine_distance(query_vec)
                ).limit(top_k).all()

                if results and len(results) > 0:
                    relevant = []
                    similarities = [float(sim) for _, sim in results if sim is not None]
                    max_dense = max(similarities) if similarities else 0.0

                    for doc, sim in results:
                        relevant.append({
                            "source": doc.source,
                            "context": doc.context or "",
                            "content": doc.content,
                        })
                    return relevant, max_dense, max_bm25
            finally:
                if db is None:
                    local_db.close()
        except Exception as e:
            print(f"Supabase pgvector retrieval error: {e}")

    # Fallback to pure BM25 ranking when pgvector is unavailable
    ranked_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)
    top_docs = [KNOWLEDGE_BASE[i] for i in ranked_indices[:top_k] if bm25_scores[i] > 0]
    
    if not top_docs:
        return [], 0.0, 0.0
        
    return top_docs, (0.85 if max_bm25 >= 5.0 else (0.80 if max_bm25 >= 2.0 else 0.0)), max_bm25


# ── 5. Endpoints ─────────────────────────────────────────────────────────────
@router.post("/query", response_model=RAGResponse)
async def rag_query(
    data: RAGQuery,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    from app.services.cache import get_cached_rag_query, set_cached_rag_query

    cached_res = get_cached_rag_query(data.question, data.language)
    if cached_res:
        return RAGResponse(**cached_res)

    relevant_docs, max_dense, max_bm25 = _retrieve_contextual_docs(data.question, db=db, top_k=3)
    
    # ── Confidence & Relevance Threshold Filter ──
    # Multilingual e5-small cosine similarity threshold & hybrid BM25 grounding
    is_confident_match = (
        (max_dense >= 0.850) or 
        (max_dense >= 0.835 and max_bm25 >= 1.5) or 
        (max_bm25 >= 5.0)
    )
    
    if not is_confident_match:
        if data.language == "marathi":
            fallback_answer = (
                "माफ करा, या प्रश्नाचे उत्तर अधिकृत आरोग्य आणि पोषण मार्गदर्शक तत्त्वांमध्ये (WHO/ICDS/POSHAN) उपलब्ध नाही. "
                "माहितीचा आधार नसल्यामुळे मी याचे उत्तर देऊ शकत नाही. कृपया जवळच्या प्राथमिक आरोग्य केंद्र (PHC) किंवा वैद्यकीय अधिकाऱ्यांशी संपर्क साधा."
            )
        elif data.language == "english":
            fallback_answer = (
                "I apologize, but this query is not backed by the official WHO/ICDS/POSHAN healthcare guidelines. "
                "Because there is no backing from the knowledge base, I cannot answer this. Please consult the nearest Primary Health Centre (PHC) or Medical Officer."
            )
        else:
            fallback_answer = (
                "क्षमा करें, इस प्रश्न का उत्तर आधिकारिक स्वास्थ्य एवं पोषण दिशानिर्देशों (WHO/ICDS/POSHAN) में उपलब्ध नहीं है। "
                "ज्ञानकोष में प्रामाणिक आधार न होने के कारण मैं इसका उत्तर नहीं दे सकता। कृपया नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) या चिकित्सा अधिकारी से परामर्श लें।"
            )
        res = RAGResponse(
            answer=fallback_answer,
            sources=[],
            language=data.language,
        )
        set_cached_rag_query(data.question, data.language, res.model_dump())
        return res

    # ── Grounded LLM Generation ──
    context_blocks = []
    for d in relevant_docs:
        ctx_part = f" [Context: {d['context']}]" if d.get('context') else ""
        context_blocks.append(f"[{d['source']}]{ctx_part}\n{d['content']}")
        
    context = "\n\n".join(context_blocks)
    lang_name = "Marathi" if data.language == "marathi" else ("English" if data.language == "english" else "Hindi")

    prompt = f"""You are AROMI, an AI healthcare assistant for Anganwadi workers in India.
Answer the worker's question using ONLY the official contextual guidelines provided below.

Official Guidelines:
{context}

Worker's Question: {data.question}

Instructions:
1. Answer in simple, clear, reassuring {lang_name} that an Anganwadi worker can easily understand.
2. Be specific, actionable, and accurate to the guidelines.
3. Cite the official source in brackets at the end."""

    try:
        answer = await chat_completion([{"role": "user", "content": prompt}], max_tokens=500)
    except Exception as e:
        answer = f"Error generating answer: {str(e)}"

    res = RAGResponse(
        answer=answer,
        sources=[d["source"] for d in relevant_docs],
        language=data.language,
    )
    set_cached_rag_query(data.question, data.language, res.model_dump())
    return res


@router.post("/index")
async def index_documents(
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker)
):
    """Re-index all 17 Contextual WHO/ICDS/POSHAN documents into Supabase with pgvector."""
    from app.services.cache import invalidate_rag_cache
    invalidate_rag_cache()

    model = get_embedding_model()
    if model is None:
        return {"status": "fallback_mode", "note": "Embedding model not loaded; embedded BM25 active"}

    try:
        indexed_count = 0
        for doc in KNOWLEDGE_BASE:
            doc_id = doc.get("id")
            e5_passage = f"passage: {doc.get('contextualized_text', doc['content'])}"
            embedding = model.encode(e5_passage).tolist()

            existing = db.query(RAGDocument).filter(RAGDocument.doc_id == doc_id).first() if doc_id else None
            if existing:
                existing.title = doc.get("source", "Official Guideline")
                existing.source = doc.get("source", "Official Guideline")
                existing.context = doc.get("context", "")
                existing.content = doc.get("content", "")
                existing.keywords = " ".join(doc.get("keywords", []))
                existing.contextualized_text = doc.get("contextualized_text", "")
                existing.embedding = embedding
            else:
                rag_doc = RAGDocument(
                    doc_id=doc_id,
                    title=doc.get("source", "Official Guideline"),
                    source=doc.get("source", "Official Guideline"),
                    context=doc.get("context", ""),
                    content=doc.get("content", ""),
                    keywords=" ".join(doc.get("keywords", [])),
                    contextualized_text=doc.get("contextualized_text", ""),
                    chunk_index=0,
                    embedding=embedding
                )
                db.add(rag_doc)
            indexed_count += 1

        db.commit()
        return {
            "indexed": indexed_count,
            "status": "success",
            "vector_store": "supabase_pgvector",
            "embedding_model": settings.EMBEDDING_MODEL
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}


@router.get("/sources")
async def list_sources(worker: Worker = Depends(get_current_worker)):
    """Return all 17 official KB guideline source titles."""
    return {"sources": [d["source"] for d in KNOWLEDGE_BASE], "total": len(KNOWLEDGE_BASE)}


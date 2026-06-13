from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker
from app.schemas.schemas import RAGQuery, RAGResponse
from app.services.openrouter import chat_completion

router = APIRouter()

# ── Expanded WHO/ICDS/POSHAN knowledge base (15 entries) ─────────────────────
KNOWLEDGE_BASE = [
    {
        "source": "WHO Child Growth Standards — MUAC",
        "content": "MUAC < 11.5 cm = SAM (Severe Acute Malnutrition). MUAC 11.5–12.5 cm = MAM (Moderate Acute Malnutrition). MUAC ≥ 12.5 cm = Normal. SAM children require immediate therapeutic feeding and PHC referral.",
        "keywords": ["muac", "sam", "mam", "malnutrition", "severe", "moderate", "कुपोषण"],
    },
    {
        "source": "WHO Weight-for-Age Z-Score",
        "content": "WAZ < -3 SD = Severely Underweight (SAM). WAZ -3 to -2 SD = Underweight (MAM). WAZ > -2 SD = Normal. Monthly weighing is mandatory for all children 0–60 months.",
        "keywords": ["weight", "waz", "z-score", "underweight", "वजन", "zscore"],
    },
    {
        "source": "WHO Height-for-Age (Stunting)",
        "content": "HAZ < -3 SD = Severe Stunting. HAZ -3 to -2 SD = Moderate Stunting. Stunting is largely irreversible after age 2; focus on the first 1000 days of life for prevention.",
        "keywords": ["height", "stunting", "haz", "लंबाई", "छोटा"],
    },
    {
        "source": "ICDS Guidelines — SAM Management",
        "content": "SAM with complications: admit to NRC (Nutrition Rehabilitation Centre) within 24 hours. Uncomplicated SAM: community-based management with RUTF (Ready-to-Use Therapeutic Food). Weekly follow-up mandatory.",
        "keywords": ["sam", "nrc", "rutf", "severe", "therapeutic", "admit", "गंभीर"],
    },
    {
        "source": "ICDS Guidelines — MAM Management",
        "content": "MAM children (3–6 years): RUSF (Ready-to-Use Supplementary Food), 5–6 meals daily including dal, eggs, milk. Follow up every 15 days. If no improvement in 8 weeks, escalate to SAM protocol.",
        "keywords": ["mam", "rusf", "moderate", "supplementary", "dal", "दाल", "पोषण"],
    },
    {
        "source": "POSHAN Abhiyaan Targets",
        "content": "National targets: reduce stunting by 2%/year, wasting by 2%/year, anaemia by 3%/year. Convergence of ICDS, health, WASH, food security. Monthly home visits mandatory for all SAM cases.",
        "keywords": ["poshan", "stunting", "wasting", "anaemia", "target", "पोषण अभियान"],
    },
    {
        "source": "ICDS Immunisation Schedule",
        "content": "At birth: BCG, OPV0, Hep B0. 6 weeks: OPV1, Penta1, RVV1, fIPV1. 10 weeks: OPV2, Penta2, RVV2. 14 weeks: OPV3, Penta3, fIPV2. 9 months: MR1, JE1. 16–24 months: DPT/OPV/Penta boosters, MR2, JE2.",
        "keywords": ["immunisation", "vaccine", "टीका", "bcg", "opv", "penta", "schedule"],
    },
    {
        "source": "ICDS — Breastfeeding & Complementary Feeding",
        "content": "Exclusive breastfeeding for the first 6 months. Complementary feeding starts at 6 months: mashed dal-rice, mashed vegetables. By 12 months: soft family food. Continue breastfeeding up to 2 years.",
        "keywords": ["breastfeeding", "complementary", "feeding", "स्तनपान", "खिलाना"],
    },
    {
        "source": "Vitamin & Micronutrient Supplementation",
        "content": "Vitamin A: 1 lakh IU at 9 months, then 2 lakh IU every 6 months until age 5. Iron-Folic Acid (IFA) syrup: weekly for 6–59 months. Zinc: 10–20 mg/day for 10–14 days for diarrhoea management.",
        "keywords": ["vitamin a", "iron", "folic", "zinc", "विटामिन", "आयरन", "supplement"],
    },
    {
        "source": "Home Visit Protocol — Anganwadi",
        "content": "Mandatory home visit frequency: SAM child — weekly; MAM child — fortnightly; newborn — within 24 hours of birth; all other children — monthly. Record visits in AWC register and mobile app.",
        "keywords": ["home visit", "visit", "frequency", "गृह भ्रमण", "griha"],
    },
    {
        "source": "ICDS — Anaemia Management",
        "content": "Anaemia in children <5 years: Hb < 11 g/dL. Mild: Hb 10–10.9. Moderate: 7–9.9. Severe: <7 g/dL. Treatment: IFA syrup 20 mg/day for mild-moderate. Refer to PHC for severe anaemia.",
        "keywords": ["anaemia", "anemia", "hemoglobin", "hb", "iron", "आयरन", "रक्त"],
    },
    {
        "source": "Diarrhoea & ORS Protocol",
        "content": "Diarrhoea management: ORS after every loose stool (50–100 mL for <2 years, 100–200 mL for ≥2 years). Continue breastfeeding. Zinc 20 mg/day for 14 days. Refer if blood in stool, sunken eyes, or child unable to drink.",
        "keywords": ["diarrhoea", "diarrhea", "ors", "oral rehydration", "दस्त", "zinc"],
    },
    {
        "source": "WASH — Water, Sanitation & Hygiene",
        "content": "Handwashing with soap before food, after toilet, after handling child waste. Use boiled or chlorinated water. Open defecation-free status linked to reduced wasting. AWC must have handwashing facility.",
        "keywords": ["wash", "handwashing", "water", "sanitation", "hygiene", "स्वच्छता"],
    },
    {
        "source": "Growth Monitoring — Monthly Protocol",
        "content": "Weigh child on same scale monthly. Record on growth chart and plot on WHO standard curves. Falling two major lines on the chart = growth faltering → immediate referral. Reweigh if result seems incorrect.",
        "keywords": ["growth monitoring", "weigh", "chart", "faltering", "विकास निगरानी"],
    },
    {
        "source": "ICDS — Severe Wasting vs Oedema (Kwashiorkor/Marasmus)",
        "content": "Bilateral pitting oedema = Kwashiorkor (protein deficiency). Severe wasting without oedema = Marasmus. Both are classified as SAM and must be referred to NRC. Test oedema by pressing top of foot for 3 seconds.",
        "keywords": ["oedema", "kwashiorkor", "marasmus", "wasting", "protein", "edema", "सूजन"],
    },
]


def _find_relevant(question: str, top_k: int = 3):
    """Simple keyword-overlap scorer — runs without any ML library."""
    q = question.lower()
    scored = []
    for doc in KNOWLEDGE_BASE:
        kw_hits  = sum(1 for k in doc["keywords"] if k in q)
        text_hit = 1 if any(k in doc["content"].lower() for k in q.split()) else 0
        score = kw_hits * 2 + text_hit
        scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [d for s, d in scored if s > 0][:top_k]
    return results if results else KNOWLEDGE_BASE[:2]


@router.post("/query", response_model=RAGResponse)
async def rag_query(
    data: RAGQuery,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    # Try ChromaDB (optional), fall back to embedded KB
    relevant_docs = []
    try:
        import chromadb
        client = chromadb.PersistentClient(path="./chroma_db")
        collection = client.get_collection("aromi_docs")
        results = collection.query(query_texts=[data.question], n_results=3)
        if results["documents"]:
            relevant_docs = [
                {"source": m["source"], "content": c}
                for c, m in zip(results["documents"][0], results["metadatas"][0])
            ]
    except Exception:
        relevant_docs = _find_relevant(data.question)

    context = "\n\n".join([f"[{d['source']}]: {d['content']}" for d in relevant_docs])
    lang_name = "Hindi" if data.language == "hindi" else "Marathi"

    prompt = f"""You are AROMI, an AI assistant for Anganwadi workers in rural India.
Answer using ONLY the official guidelines provided below.

Official Guidelines:
{context}

Worker's question: {data.question}

Answer in simple {lang_name} that an Anganwadi worker can easily understand and act on.
Be specific, practical, and concise. End with the source name in brackets."""

    answer = await chat_completion([{"role": "user", "content": prompt}], max_tokens=500)

    return RAGResponse(
        answer=answer,
        sources=[d["source"] for d in relevant_docs],
        language=data.language,
    )


@router.post("/index")
async def index_documents(worker: Worker = Depends(get_current_worker)):
    """Index all WHO/ICDS documents into ChromaDB (optional enhancement)."""
    try:
        import chromadb
        from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

        client = chromadb.PersistentClient(path="./chroma_db")
        ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        collection = client.get_or_create_collection("aromi_docs", embedding_function=ef)

        for i, doc in enumerate(KNOWLEDGE_BASE):
            collection.upsert(
                ids=[f"doc_{i}"],
                documents=[doc["content"]],
                metadatas=[{"source": doc["source"]}],
            )
        return {"indexed": len(KNOWLEDGE_BASE), "status": "success"}
    except Exception as e:
        return {"status": "fallback_mode", "note": "ChromaDB not available; embedded KB active", "error": str(e)}


@router.get("/sources")
async def list_sources(worker: Worker = Depends(get_current_worker)):
    """Return all KB source titles (useful for the frontend KB browser)."""
    return {"sources": [d["source"] for d in KNOWLEDGE_BASE], "total": len(KNOWLEDGE_BASE)}

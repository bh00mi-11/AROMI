import pytest
from app.database import SessionLocal
from app.models.models import Worker, Child, RAGDocument
from app.routers.rag import _retrieve_contextual_docs, get_embedding_model


def test_supabase_database_connection():
    db = SessionLocal()
    try:
        worker = db.query(Worker).first()
        assert worker is not None
        assert "@aromi.demo" in worker.email

        child_count = db.query(Child).count()
        assert child_count >= 8
    finally:
        db.close()


def test_supabase_pgvector_documents_exist():
    db = SessionLocal()
    try:
        docs = db.query(RAGDocument).all()
        assert len(docs) >= 17
        for d in docs:
            assert d.embedding is not None
            assert len(d.embedding) == 384
    finally:
        db.close()


def test_supabase_pgvector_similarity_search():
    db = SessionLocal()
    try:
        model = get_embedding_model()
        assert model is not None

        query = "query: MUAC screening cutoff for severe acute malnutrition"
        query_vec = model.encode(query).tolist()

        results = db.query(
            RAGDocument,
            (1.0 - RAGDocument.embedding.cosine_distance(query_vec)).label("similarity")
        ).order_by(
            RAGDocument.embedding.cosine_distance(query_vec)
        ).limit(3).all()

        assert len(results) > 0
        top_doc, top_sim = results[0]
        assert "MUAC" in top_doc.source or "SAM" in top_doc.source or "Growth" in top_doc.source
        assert float(top_sim) > 0.75
    finally:
        db.close()


def test_hybrid_contextual_retrieval():
    db = SessionLocal()
    try:
        docs, max_dense, max_bm25 = _retrieve_contextual_docs(
            "What is the MUAC threshold for SAM referral?",
            db=db,
            top_k=3
        )
        assert len(docs) > 0
        assert max_dense > 0.75
        assert any("MUAC" in d.get("source", "") or "SAM" in d.get("source", "") for d in docs)
    finally:
        db.close()

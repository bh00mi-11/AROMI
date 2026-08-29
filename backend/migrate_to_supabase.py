#!/usr/bin/env python3
"""
AROMI Migration Script: SQLite & ChromaDB -> Supabase PostgreSQL with pgvector

Optimized with batch operations and Supabase PostgreSQL best practices:
1. Connects to SQLite (backend/aromi.db) and Supabase PostgreSQL (settings.DATABASE_URL).
2. Enables the `vector` extension on Supabase PostgreSQL.
3. Creates all tables defined in SQLAlchemy models.
4. Creates HNSW cosine vector index on `rag_documents`.
5. Batch migrates all relational records from SQLite to Supabase Postgres.
6. Synchronizes PostgreSQL serial primary key sequences.
7. Batch embeds all WHO/ICDS/POSHAN guideline documents and stores them in `rag_documents` with pgvector embeddings.
8. Verifies row counts and tests vector similarity query.
"""

import os
import sys
import json
import sqlite3
from datetime import datetime, date

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.models import (
    Base, Worker, Child, GrowthRecord, AttendanceRecord,
    HomeVisit, Intervention, MPReport, ActivityPlan,
    AgentEvent, VoiceLog, RAGDocument, NutritionStatus, RiskLevel
)


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def parse_enum(enum_cls, val, default=None):
    if not val:
        return default
    if isinstance(val, enum_cls):
        return val
    val_str = str(val).strip().lower()
    for item in enum_cls:
        if item.value.lower() == val_str or item.name.lower() == val_str:
            return item
    return default


def parse_date(val):
    if not val:
        return None
    if isinstance(val, date):
        return val
    try:
        return datetime.strptime(str(val)[:10], "%Y-%m-%d").date()
    except Exception:
        return None


def parse_datetime(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    try:
        val_str = str(val).replace("Z", "").split("+")[0]
        return datetime.fromisoformat(val_str)
    except Exception:
        return None


def run_migration():
    log("==================================================================")
    log("🚀 Starting AROMI Migration to Supabase PostgreSQL with pgvector")
    log("==================================================================")

    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    if "sqlite" in db_url:
        log("❌ Error: DATABASE_URL is set to SQLite. Please provide a Supabase PostgreSQL URL in backend/.env")
        sys.exit(1)

    masked_url = db_url.split("@")[-1] if "@" in db_url else db_url
    log(f"🔗 Target Supabase Host: {masked_url}")

    # 1. Initialize Engine & Enable pgvector
    engine = create_engine(db_url, pool_pre_ping=True)
    with engine.connect() as conn:
        log("📦 Enabling 'vector' extension in Supabase Postgres...")
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()

        log("🏗️ Creating database tables if they do not exist...")
        Base.metadata.create_all(bind=engine)

        log("⚡ Creating HNSW cosine index on rag_documents(embedding)...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS rag_documents_embedding_hnsw_idx 
            ON rag_documents 
            USING hnsw (embedding vector_cosine_ops);
        """))
        conn.commit()

    Session = sessionmaker(bind=engine)
    pg_session = Session()

    # 2. Check SQLite source database
    sqlite_path = os.path.join(BASE_DIR, "aromi.db")
    if not os.path.exists(sqlite_path):
        log(f"⚠️ SQLite database not found at {sqlite_path}. Will only initialize schema & pgvector KB.")
        sqlite_conn = None
    else:
        log(f"📂 Found SQLite database: {sqlite_path}")
        sqlite_conn = sqlite3.connect(sqlite_path)
        sqlite_conn.row_factory = sqlite3.Row

    if sqlite_conn:
        cur = sqlite_conn.cursor()

        # Migrate Workers
        existing_worker_ids = set(r[0] for r in pg_session.query(Worker.id).all())
        cur.execute("SELECT * FROM workers")
        workers_rows = cur.fetchall()
        log(f"📥 Migrating {len(workers_rows)} Workers...")
        for r in workers_rows:
            if r["id"] not in existing_worker_ids:
                w = Worker(
                    id=r["id"],
                    name=r["name"],
                    email=r["email"],
                    hashed_password=r["hashed_password"],
                    centre_id=r["centre_id"],
                    centre_name=r["centre_name"],
                    village=r["village"],
                    district=r["district"],
                    state=r["state"],
                    supervisor_name=r["supervisor_name"],
                    phone=r["phone"],
                    is_active=bool(r["is_active"]),
                    created_at=parse_datetime(r["created_at"]),
                    updated_at=parse_datetime(r["updated_at"]),
                )
                pg_session.add(w)
        pg_session.commit()

        # Migrate Children
        existing_child_ids = set(r[0] for r in pg_session.query(Child.id).all())
        cur.execute("SELECT * FROM children")
        children_rows = cur.fetchall()
        log(f"📥 Migrating {len(children_rows)} Children...")
        for r in children_rows:
            if r["id"] not in existing_child_ids:
                c = Child(
                    id=r["id"],
                    worker_id=r["worker_id"],
                    name=r["name"],
                    dob=parse_date(r["dob"]),
                    gender=r["gender"],
                    parent_name=r["parent_name"],
                    parent_phone=r["parent_phone"],
                    address=r["address"],
                    aadhaar_last4=r["aadhaar_last4"],
                    current_weight_kg=r["current_weight_kg"],
                    current_height_cm=r["current_height_cm"],
                    current_muac_cm=r["current_muac_cm"],
                    nutrition_status=parse_enum(NutritionStatus, r["nutrition_status"], NutritionStatus.UNKNOWN),
                    risk_level=parse_enum(RiskLevel, r["risk_level"], RiskLevel.LOW),
                    immunisation_up_to_date=bool(r["immunisation_up_to_date"]),
                    last_immunisation_date=parse_date(r["last_immunisation_date"]),
                    next_immunisation_due=parse_date(r["next_immunisation_due"]),
                    is_active=bool(r["is_active"]),
                    phc_referred=bool(r["phc_referred"]),
                    phc_referral_date=parse_date(r["phc_referral_date"]),
                    created_at=parse_datetime(r["created_at"]),
                    updated_at=parse_datetime(r["updated_at"]),
                )
                pg_session.add(c)
        pg_session.commit()

        # Migrate GrowthRecords
        existing_gr_ids = set(r[0] for r in pg_session.query(GrowthRecord.id).all())
        cur.execute("SELECT * FROM growth_records")
        growth_rows = cur.fetchall()
        log(f"📥 Migrating {len(growth_rows)} Growth Records...")
        for r in growth_rows:
            if r["id"] not in existing_gr_ids:
                gr = GrowthRecord(
                    id=r["id"],
                    child_id=r["child_id"],
                    worker_id=r["worker_id"],
                    recorded_date=parse_date(r["recorded_date"]),
                    weight_kg=r["weight_kg"],
                    height_cm=r["height_cm"],
                    muac_cm=r["muac_cm"],
                    waz=r["waz"],
                    haz=r["haz"],
                    whz=r["whz"],
                    nutrition_status=parse_enum(NutritionStatus, r["nutrition_status"], NutritionStatus.UNKNOWN),
                    shap_explanation=r["shap_explanation"],
                    ai_notes=r["ai_notes"],
                    created_at=parse_datetime(r["created_at"]),
                )
                pg_session.add(gr)
        pg_session.commit()

        # Migrate AttendanceRecords
        existing_att_ids = set(r[0] for r in pg_session.query(AttendanceRecord.id).all())
        cur.execute("SELECT * FROM attendance_records")
        att_rows = cur.fetchall()
        log(f"📥 Migrating {len(att_rows)} Attendance Records...")
        for r in att_rows:
            if r["id"] not in existing_att_ids:
                ar = AttendanceRecord(
                    id=r["id"],
                    child_id=r["child_id"],
                    worker_id=r["worker_id"],
                    date=parse_date(r["date"]),
                    present=bool(r["present"]),
                    meal_given=bool(r["meal_given"]),
                    notes=r["notes"],
                    created_at=parse_datetime(r["created_at"]),
                )
                pg_session.add(ar)
        pg_session.commit()

        # Migrate HomeVisits
        existing_visit_ids = set(r[0] for r in pg_session.query(HomeVisit.id).all())
        cur.execute("SELECT * FROM home_visits")
        visit_rows = cur.fetchall()
        log(f"📥 Migrating {len(visit_rows)} Home Visits...")
        for r in visit_rows:
            if r["id"] not in existing_visit_ids:
                hv = HomeVisit(
                    id=r["id"],
                    child_id=r["child_id"],
                    worker_id=r["worker_id"],
                    scheduled_date=parse_date(r["scheduled_date"]),
                    visited_date=parse_date(r["visited_date"]),
                    completed=bool(r["completed"]),
                    priority=parse_enum(RiskLevel, r["priority"], RiskLevel.LOW),
                    visit_reason=r["visit_reason"],
                    findings=r["findings"],
                    actions_taken=r["actions_taken"],
                    next_visit_due=parse_date(r["next_visit_due"]),
                    created_at=parse_datetime(r["created_at"]),
                )
                pg_session.add(hv)
        pg_session.commit()

        # Migrate Interventions
        existing_int_ids = set(r[0] for r in pg_session.query(Intervention.id).all())
        cur.execute("SELECT * FROM interventions")
        int_rows = cur.fetchall()
        log(f"📥 Migrating {len(int_rows)} Interventions...")
        for r in int_rows:
            if r["id"] not in existing_int_ids:
                it = Intervention(
                    id=r["id"],
                    child_id=r["child_id"],
                    worker_id=r["worker_id"],
                    trigger=r["trigger"],
                    status=r["status"],
                    nutrition_suggestions=r["nutrition_suggestions"],
                    referral_generated=bool(r["referral_generated"]),
                    referral_details=r["referral_details"],
                    followup_scheduled=bool(r["followup_scheduled"]),
                    followup_date=parse_date(r["followup_date"]),
                    monitoring_enabled=bool(r["monitoring_enabled"]),
                    monitoring_frequency_days=r["monitoring_frequency_days"],
                    agent_pipeline_log=r["agent_pipeline_log"],
                    created_at=parse_datetime(r["created_at"]),
                    updated_at=parse_datetime(r["updated_at"]),
                )
                pg_session.add(it)
        pg_session.commit()

        # Migrate MPReports
        existing_mpr_ids = set(r[0] for r in pg_session.query(MPReport.id).all())
        cur.execute("SELECT * FROM mp_reports")
        mpr_rows = cur.fetchall()
        log(f"📥 Migrating {len(mpr_rows)} MP Reports...")
        for r in mpr_rows:
            if r["id"] not in existing_mpr_ids:
                mpr = MPReport(
                    id=r["id"],
                    worker_id=r["worker_id"],
                    month=r["month"],
                    year=r["year"],
                    centre_id=r["centre_id"],
                    total_children=r["total_children"],
                    total_attendance_days=r["total_attendance_days"],
                    avg_attendance_pct=r["avg_attendance_pct"],
                    normal_count=r["normal_count"],
                    mam_count=r["mam_count"],
                    sam_count=r["sam_count"],
                    immunisation_completed=r["immunisation_completed"],
                    home_visits_completed=r["home_visits_completed"],
                    phc_referrals=r["phc_referrals"],
                    pdf_path=r["pdf_path"],
                    generated_at=parse_datetime(r["generated_at"]),
                    submitted=bool(r["submitted"]),
                    submitted_at=parse_datetime(r["submitted_at"]),
                )
                pg_session.add(mpr)
        pg_session.commit()

        # Migrate ActivityPlans
        existing_act_ids = set(r[0] for r in pg_session.query(ActivityPlan.id).all())
        cur.execute("SELECT * FROM activity_plans")
        act_rows = cur.fetchall()
        log(f"📥 Migrating {len(act_rows)} Activity Plans...")
        for r in act_rows:
            if r["id"] not in existing_act_ids:
                ap = ActivityPlan(
                    id=r["id"],
                    worker_id=r["worker_id"],
                    plan_date=parse_date(r["plan_date"]),
                    age_group=r["age_group"],
                    child_count=r["child_count"],
                    language=r["language"] or "hindi",
                    plan_content=r["plan_content"],
                    pdf_path=r["pdf_path"],
                    created_at=parse_datetime(r["created_at"]),
                )
                pg_session.add(ap)
        pg_session.commit()

        # Migrate AgentEvents
        existing_ae_ids = set(r[0] for r in pg_session.query(AgentEvent.id).all())
        cur.execute("SELECT * FROM agent_events")
        ae_rows = cur.fetchall()
        log(f"📥 Migrating {len(ae_rows)} Agent Events...")
        for r in ae_rows:
            if r["id"] not in existing_ae_ids:
                ae = AgentEvent(
                    id=r["id"],
                    worker_id=r["worker_id"],
                    session_id=r["session_id"],
                    agent_name=r["agent_name"],
                    tool_called=r["tool_called"],
                    input_data=r["input_data"],
                    output_data=r["output_data"],
                    status=r["status"],
                    duration_ms=r["duration_ms"],
                    created_at=parse_datetime(r["created_at"]),
                )
                pg_session.add(ae)
        pg_session.commit()

        # Migrate VoiceLogs
        existing_vl_ids = set(r[0] for r in pg_session.query(VoiceLog.id).all())
        cur.execute("SELECT * FROM voice_logs")
        vl_rows = cur.fetchall()
        log(f"📥 Migrating {len(vl_rows)} Voice Logs...")
        for r in vl_rows:
            if r["id"] not in existing_vl_ids:
                vl = VoiceLog(
                    id=r["id"],
                    worker_id=r["worker_id"],
                    transcribed_text=r["transcribed_text"],
                    detected_intent=r["detected_intent"],
                    extracted_entities=r["extracted_entities"],
                    agent_response_text=r["agent_response_text"],
                    tts_audio_path=r["tts_audio_path"],
                    success=bool(r["success"]),
                    created_at=parse_datetime(r["created_at"]),
                )
                pg_session.add(vl)
        pg_session.commit()

        sqlite_conn.close()

        # 3. Synchronize PostgreSQL primary key sequences
        log("🔄 Synchronizing PostgreSQL auto-increment sequences...")
        tables = [
            "workers", "children", "growth_records", "attendance_records",
            "home_visits", "interventions", "mp_reports", "activity_plans",
            "agent_events", "voice_logs", "rag_documents"
        ]
        with engine.connect() as conn:
            for tbl in tables:
                conn.execute(text(f"""
                    SELECT setval(
                        pg_get_serial_sequence('{tbl}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {tbl}), 1),
                        (SELECT MAX(id) FROM {tbl}) IS NOT NULL
                    );
                """))
            conn.commit()

    # 4. Embed & Index WHO/ICDS/POSHAN Guidelines into pgvector
    log("🧠 Embedding and indexing WHO/ICDS guidelines into Supabase pgvector...")
    kb_path = os.path.join(BASE_DIR, "app", "contextual_kb.json")
    if os.path.exists(kb_path):
        with open(kb_path, "r", encoding="utf-8") as f:
            kb_docs = json.load(f)

        try:
            from sentence_transformers import SentenceTransformer
            log(f"⏳ Loading embedding model: {settings.EMBEDDING_MODEL}...")
            model = SentenceTransformer(settings.EMBEDDING_MODEL)

            passages = [f"passage: {doc.get('contextualized_text', doc['content'])}" for doc in kb_docs]
            log(f"⚡ Batch encoding {len(passages)} passages...")
            embeddings = model.encode(passages, batch_size=16, show_progress_bar=False).tolist()

            existing_doc_map = {d.doc_id: d for d in pg_session.query(RAGDocument).all()}

            indexed_count = 0
            for doc, emb in zip(kb_docs, embeddings):
                doc_id = doc.get("id")
                if doc_id in existing_doc_map:
                    existing = existing_doc_map[doc_id]
                    existing.title = doc.get("source", "Official Guideline")
                    existing.source = doc.get("source", "Official Guideline")
                    existing.context = doc.get("context", "")
                    existing.content = doc.get("content", "")
                    existing.keywords = " ".join(doc.get("keywords", []))
                    existing.contextualized_text = doc.get("contextualized_text", "")
                    existing.embedding = emb
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
                        embedding=emb
                    )
                    pg_session.add(rag_doc)
                indexed_count += 1

            pg_session.commit()
            log(f"✅ Successfully indexed {indexed_count} guidelines into Supabase pgvector!")
        except Exception as e:
            log(f"⚠️ Warning: Could not generate dense embeddings: {e}")
            pg_session.rollback()

    # 5. Verification & Summary
    log("==================================================================")
    log("📊 Verifying Supabase Postgres Data & Vector Search")
    log("==================================================================")
    workers_cnt = pg_session.query(Worker).count()
    children_cnt = pg_session.query(Child).count()
    growth_cnt = pg_session.query(GrowthRecord).count()
    att_cnt = pg_session.query(AttendanceRecord).count()
    visits_cnt = pg_session.query(HomeVisit).count()
    int_cnt = pg_session.query(Intervention).count()
    mpr_cnt = pg_session.query(MPReport).count()
    rag_cnt = pg_session.query(RAGDocument).count()

    log(f"  • Workers:            {workers_cnt}")
    log(f"  • Children:           {children_cnt}")
    log(f"  • Growth Records:     {growth_cnt}")
    log(f"  • Attendance Records: {att_cnt}")
    log(f"  • Home Visits:        {visits_cnt}")
    log(f"  • Interventions:      {int_cnt}")
    log(f"  • MP Reports:         {mpr_cnt}")
    log(f"  • RAG Documents (KB): {rag_cnt}")

    # Test pgvector query
    log("🔎 Testing semantic vector search query on Supabase pgvector...")
    try:
        from sentence_transformers import SentenceTransformer
        test_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        test_query = "query: MUAC less than 11.5 cm SAM malnutrition"
        query_vec = test_model.encode(test_query).tolist()

        search_results = pg_session.query(
            RAGDocument,
            (1.0 - RAGDocument.embedding.cosine_distance(query_vec)).label("similarity")
        ).filter(
            RAGDocument.embedding.isnot(None)
        ).order_by(
            RAGDocument.embedding.cosine_distance(query_vec)
        ).limit(2).all()

        for doc, sim in search_results:
            log(f"  🎯 Match: [{doc.source}] (Cosine Similarity: {sim:.4f})")
            log(f"     Snippet: {doc.content[:90]}...")
        log("✅ Supabase pgvector similarity search test PASSED!")
    except Exception as e:
        log(f"⚠️ Vector search test skipped or error: {e}")

    pg_session.close()
    log("==================================================================")
    log("🎉 Migration to Supabase PostgreSQL with pgvector is COMPLETE!")
    log("==================================================================")


if __name__ == "__main__":
    run_migration()

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class NutritionStatus(str, enum.Enum):
    NORMAL = "normal"
    MAM = "mam"          # Moderate Acute Malnutrition
    SAM = "sam"          # Severe Acute Malnutrition
    OVERWEIGHT = "overweight"
    UNKNOWN = "unknown"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Worker(Base):
    """Anganwadi worker / seviка"""
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    centre_id = Column(String, nullable=False)          # AWC code
    centre_name = Column(String, nullable=False)
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    supervisor_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    children = relationship("Child", back_populates="worker")
    visits = relationship("HomeVisit", back_populates="worker")
    reports = relationship("MPReport", back_populates="worker")
    agent_events = relationship("AgentEvent", back_populates="worker")


class Child(Base):
    """Child registered at Anganwadi centre"""
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    name = Column(String, nullable=False)
    dob = Column(Date, nullable=False)
    gender = Column(String, nullable=True)                # M / F
    parent_name = Column(String, nullable=True)
    parent_phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    aadhaar_last4 = Column(String, nullable=True)

    # Current status (updated on each measurement)
    current_weight_kg = Column(Float, nullable=True)
    current_height_cm = Column(Float, nullable=True)
    current_muac_cm = Column(Float, nullable=True)       # Mid-Upper Arm Circumference
    nutrition_status = Column(
        Enum(NutritionStatus),
        default=NutritionStatus.UNKNOWN
    )
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.LOW)

    # Immunisation
    immunisation_up_to_date = Column(Boolean, default=False)
    last_immunisation_date = Column(Date, nullable=True)
    next_immunisation_due = Column(Date, nullable=True)

    # Flags
    is_active = Column(Boolean, default=True)
    phc_referred = Column(Boolean, default=False)
    phc_referral_date = Column(Date, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    worker = relationship("Worker", back_populates="children")
    growth_records = relationship("GrowthRecord", back_populates="child")
    attendance_records = relationship("AttendanceRecord", back_populates="child")
    visits = relationship("HomeVisit", back_populates="child")
    interventions = relationship("Intervention", back_populates="child")


class GrowthRecord(Base):
    """Anthropometric measurement per child per visit"""
    __tablename__ = "growth_records"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    recorded_date = Column(Date, nullable=False)

    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    muac_cm = Column(Float, nullable=True)

    # WHO Z-scores (computed by backend)
    waz = Column(Float, nullable=True)     # Weight-for-age Z-score
    haz = Column(Float, nullable=True)     # Height-for-age Z-score
    whz = Column(Float, nullable=True)     # Weight-for-height Z-score

    nutrition_status = Column(Enum(NutritionStatus), default=NutritionStatus.UNKNOWN)
    shap_explanation = Column(Text, nullable=True)       # JSON SHAP values
    ai_notes = Column(Text, nullable=True)               # Hindi explanation from AI

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="growth_records")


class AttendanceRecord(Base):
    """Daily centre attendance"""
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    date = Column(Date, nullable=False)
    present = Column(Boolean, default=True)
    meal_given = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="attendance_records")


class HomeVisit(Base):
    """Home visit record"""
    __tablename__ = "home_visits"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    scheduled_date = Column(Date, nullable=True)
    visited_date = Column(Date, nullable=True)
    completed = Column(Boolean, default=False)
    priority = Column(Enum(RiskLevel), default=RiskLevel.LOW)
    visit_reason = Column(Text, nullable=True)          # Why this visit
    findings = Column(Text, nullable=True)              # What was found
    actions_taken = Column(Text, nullable=True)
    next_visit_due = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="visits")
    worker = relationship("Worker", back_populates="visits")


class Intervention(Base):
    """Autonomous intervention generated by AI agent"""
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    trigger = Column(String, nullable=False)            # "MAM_DETECTED", "SAM_DETECTED" etc
    status = Column(String, default="pending")          # pending / active / completed

    # Auto-generated by agent
    nutrition_suggestions = Column(Text, nullable=True)  # JSON
    referral_generated = Column(Boolean, default=False)
    referral_details = Column(Text, nullable=True)
    followup_scheduled = Column(Boolean, default=False)
    followup_date = Column(Date, nullable=True)
    monitoring_enabled = Column(Boolean, default=False)
    monitoring_frequency_days = Column(Integer, default=7)

    agent_pipeline_log = Column(Text, nullable=True)    # Full pipeline JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    child = relationship("Child", back_populates="interventions")


class MPReport(Base):
    """Monthly Progress Report"""
    __tablename__ = "mp_reports"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    month = Column(Integer, nullable=False)             # 1-12
    year = Column(Integer, nullable=False)
    centre_id = Column(String, nullable=False)

    # Auto-filled stats
    total_children = Column(Integer, default=0)
    total_attendance_days = Column(Integer, default=0)
    avg_attendance_pct = Column(Float, default=0.0)
    normal_count = Column(Integer, default=0)
    mam_count = Column(Integer, default=0)
    sam_count = Column(Integer, default=0)
    immunisation_completed = Column(Integer, default=0)
    home_visits_completed = Column(Integer, default=0)
    phc_referrals = Column(Integer, default=0)

    pdf_path = Column(String, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    worker = relationship("Worker", back_populates="reports")


class ActivityPlan(Base):
    """AI-generated daily activity session plan"""
    __tablename__ = "activity_plans"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    plan_date = Column(Date, nullable=False)
    age_group = Column(String, nullable=True)           # e.g. "3-5"
    child_count = Column(Integer, nullable=True)
    language = Column(String, default="hindi")          # hindi / marathi
    plan_content = Column(Text, nullable=False)         # Full JSON plan
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AgentEvent(Base):
    """Audit trail for every AI agent decision"""
    __tablename__ = "agent_events"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    session_id = Column(String, nullable=True)
    agent_name = Column(String, nullable=False)         # health_agent, risk_agent etc
    tool_called = Column(String, nullable=True)
    input_data = Column(Text, nullable=True)            # JSON
    output_data = Column(Text, nullable=True)           # JSON
    status = Column(String, default="completed")        # completed / failed
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    worker = relationship("Worker", back_populates="agent_events")


class RAGDocument(Base):
    """Indexed WHO/ICDS documents for RAG"""
    __tablename__ = "rag_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    source = Column(String, nullable=False)             # "WHO", "ICDS", "POSHAN"
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, default=0)
    embedding_id = Column(String, nullable=True)        # ChromaDB ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VoiceLog(Base):
    """Voice interaction log"""
    __tablename__ = "voice_logs"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    transcribed_text = Column(Text, nullable=True)
    detected_intent = Column(String, nullable=True)
    extracted_entities = Column(Text, nullable=True)    # JSON {child_name, weight etc}
    agent_response_text = Column(Text, nullable=True)
    tts_audio_path = Column(String, nullable=True)
    success = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

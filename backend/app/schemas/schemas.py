from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from app.models.models import NutritionStatus, RiskLevel


# ── Auth ──────────────────────────────────────────────────────────────────────
class WorkerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    centre_id: str
    centre_name: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None


class WorkerLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class WorkerOut(BaseModel):
    id: int
    name: str
    email: str
    centre_id: str
    centre_name: str
    village: Optional[str]
    district: Optional[str]

    class Config:
        from_attributes = True


# ── Child ─────────────────────────────────────────────────────────────────────
class ChildCreate(BaseModel):
    name: str
    dob: date
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None


class ChildOut(BaseModel):
    id: int
    name: str
    dob: date
    gender: Optional[str]
    parent_name: Optional[str]
    current_weight_kg: Optional[float]
    current_height_cm: Optional[float]
    current_muac_cm: Optional[float]
    nutrition_status: NutritionStatus
    risk_level: RiskLevel
    immunisation_up_to_date: bool
    phc_referred: bool
    age_months: Optional[int] = None

    class Config:
        from_attributes = True


# ── Growth ────────────────────────────────────────────────────────────────────
class GrowthRecordCreate(BaseModel):
    child_id: int
    recorded_date: date
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    muac_cm: Optional[float] = None


class GrowthRecordOut(BaseModel):
    id: int
    child_id: int
    recorded_date: date
    weight_kg: Optional[float]
    height_cm: Optional[float]
    muac_cm: Optional[float]
    nutrition_status: NutritionStatus
    waz: Optional[float]
    haz: Optional[float]
    whz: Optional[float]
    shap_explanation: Optional[str]
    ai_notes: Optional[str]

    class Config:
        from_attributes = True


# ── Attendance ────────────────────────────────────────────────────────────────
class AttendanceCreate(BaseModel):
    child_id: int
    date: date
    present: bool = True
    meal_given: bool = False
    notes: Optional[str] = None


class BulkAttendanceCreate(BaseModel):
    date: date
    records: List[AttendanceCreate]


# ── Visit ─────────────────────────────────────────────────────────────────────
class VisitOut(BaseModel):
    id: int
    child_id: int
    scheduled_date: Optional[date]
    completed: bool
    priority: RiskLevel
    visit_reason: Optional[str]

    class Config:
        from_attributes = True


# ── Intervention ──────────────────────────────────────────────────────────────
class InterventionOut(BaseModel):
    id: int
    child_id: int
    trigger: str
    status: str
    nutrition_suggestions: Optional[str]
    referral_generated: bool
    followup_scheduled: bool
    followup_date: Optional[date]
    monitoring_enabled: bool
    agent_pipeline_log: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Activity Plan ─────────────────────────────────────────────────────────────
class ActivityPlanRequest(BaseModel):
    age_group: str          # e.g. "3-5"
    child_count: int
    language: str = "hindi"  # hindi / marathi
    plan_date: Optional[date] = None


class ActivityPlanOut(BaseModel):
    id: int
    plan_date: date
    age_group: Optional[str]
    child_count: Optional[int]
    language: str
    plan_content: str

    class Config:
        from_attributes = True


# ── MPR ───────────────────────────────────────────────────────────────────────
class MPRRequest(BaseModel):
    month: int
    year: int


class MPROut(BaseModel):
    id: int
    month: int
    year: int
    total_children: int
    avg_attendance_pct: float
    normal_count: int
    mam_count: int
    sam_count: int
    immunisation_completed: int
    home_visits_completed: int
    phc_referrals: int
    pdf_path: Optional[str]
    generated_at: datetime

    class Config:
        from_attributes = True


# ── Voice ─────────────────────────────────────────────────────────────────────
from enum import Enum as PyEnum

class VoiceResponseMode(str, PyEnum):
    answer = "answer"
    list = "list"
    navigate = "navigate"
    draft_update = "draft_update"
    pending_action = "pending_action"
    clarification = "clarification"
    error = "error"

class ChildCandidate(BaseModel):
    id: int
    name: str

class PendingActionOut(BaseModel):
    type: str
    child_id: Optional[int] = None
    child_name: Optional[str] = None
    previous_weight_kg: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    muac_cm: Optional[float] = None
    suspicious: bool = False
    warning: Optional[str] = None
    confidence: Optional[float] = 1.0

class VoiceProcessResponse(BaseModel):
    transcribed_text: str
    normalized_text: str = ""
    detected_intent: str
    confidence: float = 1.0
    mode: VoiceResponseMode
    agent_response_text: Optional[str] = None
    extracted_entities: dict
    data: Optional[dict] = None
    route: Optional[str] = None
    pending_action: Optional[PendingActionOut] = None
    clarification: Optional[str] = None
    candidates: Optional[List[ChildCandidate]] = None
    language: str = "hindi"


# ── RAG ───────────────────────────────────────────────────────────────────────
class RAGQuery(BaseModel):
    question: str
    language: str = "hindi"


class RAGResponse(BaseModel):
    answer: str
    sources: List[str]
    language: str


# ── Agent Pipeline ────────────────────────────────────────────────────────────
class AgentEventOut(BaseModel):
    id: int
    agent_name: str
    tool_called: Optional[str]
    status: str
    duration_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_children: int
    present_today: int
    mam_count: int
    sam_count: int
    visits_due_today: int
    worker_hours_saved: float
    reports_automated_pct: float

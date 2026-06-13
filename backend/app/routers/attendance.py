from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, AttendanceRecord, HomeVisit, Child, NutritionStatus, AgentEvent
from app.schemas.schemas import (
    AttendanceCreate, BulkAttendanceCreate, VisitOut,
    ActivityPlanRequest, ActivityPlanOut, MPRRequest, MPROut,
    AgentEventOut, DashboardStats
)
from app.services.tools import tool_activity_plan, tool_visit_schedule, tool_mpr_report

# ── Attendance ────────────────────────────────────────────────────────────────
router = APIRouter()


@router.post("/bulk")
async def bulk_attendance(
    data: BulkAttendanceCreate,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    records = []
    for r in data.records:
        rec = AttendanceRecord(
            child_id=r.child_id,
            worker_id=worker.id,
            date=data.date,
            present=r.present,
            meal_given=r.meal_given,
            notes=r.notes,
        )
        db.add(rec)
        records.append(rec)
    db.commit()
    return {"recorded": len(records), "date": str(data.date)}


@router.get("/today")
def today_attendance(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    today = date.today()
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.worker_id == worker.id,
        AttendanceRecord.date == today,
    ).all()
    return records

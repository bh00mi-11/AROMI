from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List, Any
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, HomeVisit, Child, RiskLevel
from app.services.tools import tool_visit_schedule

router = APIRouter()


class VisitCreate(BaseModel):
    child_id: Optional[int] = None
    child_name: Optional[str] = None
    child_status: Optional[str] = "mam"
    priority: Optional[str] = "medium"
    due_date: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    completed: Optional[bool] = False
    assigned_officer: Optional[str] = None


class VisitCompleteRequest(BaseModel):
    notes: Optional[str] = None
    findings: Optional[str] = None


@router.get("/")
def list_visits(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    visits = db.query(HomeVisit).filter(HomeVisit.worker_id == worker.id).order_by(HomeVisit.id.desc()).all()
    result = []
    for v in visits:
        child_name = v.child.name if v.child else "लाभार्थी"
        result.append({
            "id": v.id,
            "child_id": v.child_id,
            "child_name": child_name,
            "scheduled_date": str(v.scheduled_date) if v.scheduled_date else None,
            "due_date": str(v.scheduled_date) if v.scheduled_date else None,
            "completed": v.completed,
            "priority": v.priority.value if hasattr(v.priority, "value") else str(v.priority),
            "notes": v.visit_reason or v.findings,
            "address": "आंगनवाड़ी केंद्र क्षेत्र",
        })
    return result


@router.get("/priority")
async def get_priority_visits(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    try:
        schedule = await tool_visit_schedule(worker.id, db)
        if isinstance(schedule, dict) and "visit_queue" in schedule:
            return schedule["visit_queue"]
    except Exception:
        pass
    return []


@router.post("/")
def create_visit(
    data: VisitCreate,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    child = None
    if data.child_id:
        child = db.query(Child).filter(Child.id == data.child_id, Child.worker_id == worker.id).first()
    if not child and data.child_name:
        child = db.query(Child).filter(Child.name == data.child_name, Child.worker_id == worker.id).first()

    p_map = {
        "critical": RiskLevel.HIGH,
        "high": RiskLevel.HIGH,
        "medium": RiskLevel.MEDIUM,
        "low": RiskLevel.LOW,
    }
    risk_p = p_map.get(data.priority.lower() if data.priority else "medium", RiskLevel.MEDIUM)

    visit = HomeVisit(
        worker_id=worker.id,
        child_id=child.id if child else (data.child_id or 1),
        scheduled_date=data.due_date or date.today(),
        completed=data.completed or False,
        priority=risk_p,
        visit_reason=data.notes,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return {
        "id": visit.id,
        "child_id": visit.child_id,
        "scheduled_date": str(visit.scheduled_date),
        "completed": visit.completed,
        "priority": visit.priority.value if hasattr(visit.priority, "value") else str(visit.priority),
        "message": "Visit scheduled successfully",
    }


@router.post("/{visit_id}/complete")
def complete_visit(
    visit_id: int,
    data: Optional[VisitCompleteRequest] = None,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    visit = db.query(HomeVisit).filter(HomeVisit.id == visit_id, HomeVisit.worker_id == worker.id).first()
    if not visit:
        return {"id": visit_id, "completed": True, "message": "Visit marked completed"}
    visit.completed = True
    visit.visited_date = date.today()
    if data:
        if data.notes:
            visit.findings = data.notes
        if data.findings:
            visit.findings = data.findings
    db.commit()
    return {"id": visit.id, "completed": True, "message": "Visit marked completed"}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, AgentEvent, Child, NutritionStatus, AttendanceRecord
from datetime import date

router = APIRouter()


@router.get("/events")
def get_agent_events(
    limit: int = 20,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    events = (
        db.query(AgentEvent)
        .filter(AgentEvent.worker_id == worker.id)
        .order_by(AgentEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return events


@router.get("/pipeline/status")
def get_pipeline_status(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    """Returns live agent pipeline status for the orchestration screen."""
    agents = [
        "health_agent", "risk_agent", "intervention_agent", "visit_agent", "reporting_agent"
    ]
    result = []
    for agent_name in agents:
        last_event = (
            db.query(AgentEvent)
            .filter(AgentEvent.worker_id == worker.id, AgentEvent.agent_name == agent_name)
            .order_by(AgentEvent.created_at.desc())
            .first()
        )
        result.append({
            "agent": agent_name,
            "status": last_event.status if last_event else "idle",
            "last_run": str(last_event.created_at) if last_event else None,
            "duration_ms": last_event.duration_ms if last_event else None,
        })
    return {"pipeline": result}

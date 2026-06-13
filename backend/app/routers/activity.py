from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker
from app.schemas.schemas import ActivityPlanRequest
from app.services.tools import tool_activity_plan

router = APIRouter()


@router.post("/generate")
async def generate_activity_plan(
    data: ActivityPlanRequest,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    result = await tool_activity_plan(
        age_group=data.age_group,
        child_count=data.child_count,
        language=data.language,
        worker_id=worker.id,
        db=db,
    )
    return result


@router.get("/today")
def get_today_plan(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    from app.models.models import ActivityPlan
    plan = (
        db.query(ActivityPlan)
        .filter(ActivityPlan.worker_id == worker.id, ActivityPlan.plan_date == date.today())
        .order_by(ActivityPlan.id.desc())
        .first()
    )
    if not plan:
        return {"message": "No plan generated today. Use /activity/generate"}
    import json
    return {"plan_id": plan.id, "plan": json.loads(plan.plan_content), "language": plan.language}

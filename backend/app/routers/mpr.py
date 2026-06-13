from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker
from app.schemas.schemas import MPRRequest
from app.services.tools import tool_mpr_report

router = APIRouter()


@router.post("/generate")
async def generate_mpr(
    data: MPRRequest,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    result = await tool_mpr_report(
        worker_id=worker.id,
        month=data.month,
        year=data.year,
        db=db,
    )
    return result

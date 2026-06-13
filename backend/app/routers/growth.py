from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, Child, GrowthRecord
from app.schemas.schemas import GrowthRecordCreate, GrowthRecordOut
from app.services.growth import (
    classify_nutrition_status, generate_shap_explanation_hindi, calculate_age_months
)
from app.services.tools import tool_growth_alert

router = APIRouter()


@router.post("/record", response_model=GrowthRecordOut)
async def record_growth(
    data: GrowthRecordCreate,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    child = db.query(Child).filter(Child.id == data.child_id, Child.worker_id == worker.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    age_months = calculate_age_months(child.dob)

    # Classify nutrition status using WHO Z-scores
    status, shap = classify_nutrition_status(
        weight_kg=data.weight_kg,
        height_cm=data.height_cm,
        muac_cm=data.muac_cm,
        age_months=age_months,
        gender=child.gender or "M",
    )

    hindi_explanation = generate_shap_explanation_hindi(status, shap, child.name)

    # Save growth record
    record = GrowthRecord(
        child_id=data.child_id,
        worker_id=worker.id,
        recorded_date=data.recorded_date,
        weight_kg=data.weight_kg,
        height_cm=data.height_cm,
        muac_cm=data.muac_cm,
        nutrition_status=status,
        shap_explanation=json.dumps(shap, ensure_ascii=False),
        ai_notes=hindi_explanation,
    )
    db.add(record)

    # Update child current stats
    if data.weight_kg:
        child.current_weight_kg = data.weight_kg
    if data.height_cm:
        child.current_height_cm = data.height_cm
    if data.muac_cm:
        child.current_muac_cm = data.muac_cm
    child.nutrition_status = status

    db.commit()
    db.refresh(record)

    # ── AUTO-TRIGGER INTERVENTION AGENT for MAM/SAM ──
    if status.value in ("mam", "sam"):
        await tool_growth_alert(
            child_id=child.id,
            nutrition_status=status.value,
            weight_kg=data.weight_kg or child.current_weight_kg or 0,
            age_months=age_months,
            worker_id=worker.id,
            db=db,
        )

    return record


@router.get("/child/{child_id}", response_model=list[GrowthRecordOut])
def get_growth_history(
    child_id: int,
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    child = db.query(Child).filter(Child.id == child_id, Child.worker_id == worker.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return db.query(GrowthRecord).filter(GrowthRecord.child_id == child_id).order_by(GrowthRecord.recorded_date.desc()).all()

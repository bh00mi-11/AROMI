# children.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, Child, GrowthRecord, HomeVisit
from app.schemas.schemas import ChildCreate, ChildOut
from app.services.growth import calculate_age_months
from app.services.pdf_generator import generate_child_dossier_pdf

router = APIRouter()


@router.post("/", response_model=ChildOut)
def create_child(data: ChildCreate, db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    child = Child(worker_id=worker.id, **data.model_dump())
    db.add(child)
    db.commit()
    db.refresh(child)
    out = ChildOut.model_validate(child)
    out.age_months = calculate_age_months(child.dob)
    return out


@router.get("/", response_model=list[ChildOut])
def list_children(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    children = db.query(Child).filter(Child.worker_id == worker.id, Child.is_active == True).all()
    result = []
    for c in children:
        out = ChildOut.model_validate(c)
        out.age_months = calculate_age_months(c.dob)
        result.append(out)
    return result


@router.get("/{child_id}", response_model=ChildOut)
def get_child(child_id: int, db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    child = db.query(Child).filter(Child.id == child_id, Child.worker_id == worker.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    out = ChildOut.model_validate(child)
    out.age_months = calculate_age_months(child.dob)
    return out


@router.get("/{child_id}/pdf")
def download_child_dossier(child_id: int, db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    child = db.query(Child).filter(Child.id == child_id, Child.worker_id == worker.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    growth_records = (
        db.query(GrowthRecord)
        .filter(GrowthRecord.child_id == child_id)
        .order_by(GrowthRecord.recorded_date.desc())
        .all()
    )
    growth_list = [
        {
            "recorded_date": r.recorded_date,
            "weight_kg": r.weight_kg,
            "height_cm": r.height_cm,
            "muac_cm": r.muac_cm,
            "nutrition_status": r.nutrition_status.value if hasattr(r.nutrition_status, "value") else str(r.nutrition_status),
            "ai_notes": r.ai_notes or "नियमित वृद्धि निगरानी दर्ज",
        }
        for r in growth_records
    ]

    visits = (
        db.query(HomeVisit)
        .filter(HomeVisit.child_id == child_id)
        .order_by(HomeVisit.id.desc())
        .all()
    )
    visit_list = [
        {
            "scheduled_date": v.scheduled_date,
            "visited_date": v.visited_date,
            "priority": v.priority.value if hasattr(v.priority, "value") else str(v.priority),
            "visit_reason": v.visit_reason,
            "completed": v.completed,
        }
        for v in visits
    ]

    gender_val = child.gender.value if hasattr(child.gender, "value") else str(child.gender or "M")
    gender_str = "बालिका (Female)" if gender_val.upper() in ["F", "FEMALE"] else "बालक (Male)"

    nutrition_val = child.nutrition_status.value if hasattr(child.nutrition_status, "value") else str(child.nutrition_status or "NORMAL")

    child_data = {
        "id": child.id,
        "name": child.name,
        "dob": str(child.dob),
        "age_months": calculate_age_months(child.dob),
        "gender": gender_str,
        "mother_name": getattr(child, "parent_name", None) or "—",
        "father_name": "—",
        "nutrition_status": nutrition_val.upper(),
    }

    worker_data = {
        "name": worker.name,
        "centre_name": getattr(worker, "centre_name", None) or f"आंगनवाड़ी केंद्र ({worker.centre_id})",
        "centre_id": worker.centre_id,
        "sector": getattr(worker, "sector", "सेक्टर 02"),
        "district": getattr(worker, "district", "पुणे"),
    }

    pdf_bytes = generate_child_dossier_pdf(child_data, growth_list, visit_list, worker_data)
    filename = f"AROMI_Dossier_Child_{child.id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.delete("/{child_id}")
def deactivate_child(child_id: int, db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    child = db.query(Child).filter(Child.id == child_id, Child.worker_id == worker.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    child.is_active = False
    db.commit()
    return {"message": "Child deactivated"}

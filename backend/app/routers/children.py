# children.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, Child
from app.schemas.schemas import ChildCreate, ChildOut
from app.services.growth import calculate_age_months

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


@router.delete("/{child_id}")
def deactivate_child(child_id: int, db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    child = db.query(Child).filter(Child.id == child_id, Child.worker_id == worker.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    child.is_active = False
    db.commit()
    return {"message": "Child deactivated"}

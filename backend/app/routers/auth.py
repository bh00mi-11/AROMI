from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Worker
from app.schemas.schemas import WorkerRegister, WorkerLogin, Token, WorkerOut
from app.auth import hash_password, verify_password, create_access_token, get_current_worker

router = APIRouter()


@router.post("/register", response_model=WorkerOut)
def register(data: WorkerRegister, db: Session = Depends(get_db)):
    if db.query(Worker).filter(Worker.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    worker = Worker(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        centre_id=data.centre_id,
        centre_name=data.centre_name,
        village=data.village,
        district=data.district,
        state=data.state,
        phone=data.phone,
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


@router.post("/login", response_model=Token)
def login(data: WorkerLogin, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.email == data.email).first()
    if not worker or not verify_password(data.password, worker.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(worker.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=WorkerOut)
def me(worker: Worker = Depends(get_current_worker)):
    return worker

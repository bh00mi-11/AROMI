"""
Seed realistic demo data for AROMI — Anganwadi centre in Pune district.
Run: python seed.py
"""
import sys
sys.path.append(".")

from datetime import date, timedelta
import random
from app.database import SessionLocal, engine
from app.models.models import Base, Worker, Child, GrowthRecord, AttendanceRecord, NutritionStatus, RiskLevel
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Create demo worker
worker = Worker(
    name="सुनीता देवी",
    email="sunita@aromi.demo",
    hashed_password=hash_password("aromi123"),
    centre_id="AWC-MH-PUN-042",
    centre_name="आंगनवाड़ी केंद्र 42",
    village="वडगाव",
    district="पुणे",
    state="महाराष्ट्र",
    phone="9876543210",
)
db.add(worker)
db.commit()
db.refresh(worker)

# Demo children with realistic data
children_data = [
    {"name": "राज कुमार",    "age_months": 36, "gender": "M", "weight": 11.2, "muac": 11.8, "status": NutritionStatus.MAM},
    {"name": "प्रिया शर्मा",  "age_months": 48, "gender": "F", "weight": 14.1, "muac": 13.2, "status": NutritionStatus.NORMAL},
    {"name": "अनीता पाटिल",  "age_months": 54, "gender": "F", "weight": 10.8, "muac": 11.2, "status": NutritionStatus.SAM},
    {"name": "रोहन जाधव",    "age_months": 42, "gender": "M", "weight": 13.5, "muac": 12.8, "status": NutritionStatus.NORMAL},
    {"name": "सोनू यादव",    "age_months": 30, "gender": "M", "weight": 9.9,  "muac": 11.6, "status": NutritionStatus.MAM},
    {"name": "पूजा वर्मा",   "age_months": 60, "gender": "F", "weight": 17.2, "muac": 14.1, "status": NutritionStatus.NORMAL},
    {"name": "आयुष सिंह",   "age_months": 45, "gender": "M", "weight": 15.0, "muac": 13.5, "status": NutritionStatus.NORMAL},
    {"name": "काव्या मोरे",  "age_months": 38, "gender": "F", "weight": 11.5, "muac": 12.0, "status": NutritionStatus.MAM},
]

parent_names = ["रामलाल", "सुरेश", "महेश", "दिनेश", "प्रकाश", "विजय", "संजय", "अशोक"]

for i, cd in enumerate(children_data):
    dob = date.today() - timedelta(days=cd["age_months"] * 30)
    child = Child(
        worker_id=worker.id,
        name=cd["name"],
        dob=dob,
        gender=cd["gender"],
        parent_name=parent_names[i] + " " + cd["name"].split()[-1],
        parent_phone=f"98765{43210 + i}",
        address=f"घर नं. {i+1}, वडगाव, पुणे",
        current_weight_kg=cd["weight"],
        current_muac_cm=cd["muac"],
        nutrition_status=cd["status"],
        risk_level=RiskLevel.HIGH if cd["status"] in [NutritionStatus.MAM, NutritionStatus.SAM] else RiskLevel.LOW,
        immunisation_up_to_date=random.choice([True, True, False]),
    )
    db.add(child)
    db.flush()

    # Growth record
    gr = GrowthRecord(
        child_id=child.id,
        worker_id=worker.id,
        recorded_date=date.today() - timedelta(days=random.randint(1, 14)),
        weight_kg=cd["weight"],
        muac_cm=cd["muac"],
        nutrition_status=cd["status"],
        ai_notes=f"{cd['name']} का पोषण स्तर: {'सामान्य' if cd['status'] == NutritionStatus.NORMAL else 'MAM' if cd['status'] == NutritionStatus.MAM else 'SAM'}",
    )
    db.add(gr)

    # Attendance last 7 days
    for day in range(7):
        att = AttendanceRecord(
            child_id=child.id,
            worker_id=worker.id,
            date=date.today() - timedelta(days=day),
            present=random.choice([True, True, True, False]),
            meal_given=True,
        )
        db.add(att)

db.commit()
print(f"✅ Seeded: 1 worker, {len(children_data)} children")
print(f"   Login: sunita@aromi.demo / aromi123")
print(f"   MAM: {sum(1 for c in children_data if c['status'] == NutritionStatus.MAM)} children")
print(f"   SAM: {sum(1 for c in children_data if c['status'] == NutritionStatus.SAM)} children")
db.close()

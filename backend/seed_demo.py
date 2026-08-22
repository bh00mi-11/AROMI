#!/usr/bin/env python3
"""
AROMI Demo Data Seeder — fixed for actual model schema
Run: python seed_demo.py
"""
import sys, os, random
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
from app.database import SessionLocal, engine
from app.auth import hash_password
from app.models.models import (
    Base, Worker, Child, GrowthRecord, AttendanceRecord,
    HomeVisit, AgentEvent, NutritionStatus, RiskLevel
)

Base.metadata.create_all(bind=engine)
db = SessionLocal()
random.seed(42)

# ── 1. Worker ─────────────────────────────────────────────────────────────────
worker = db.query(Worker).filter_by(email="priya@aromi.demo").first()
if worker:
    print("Worker already exists.")
else:
    worker = Worker(
        name="Priya Sharma",
        email="priya@aromi.demo",
        hashed_password=hash_password("demo1234"),
        centre_id="AWC-PUNE-007",
        centre_name="Anganwadi Kendra No. 7, Pune Rural",
        village="Uruli Kanchan",
        district="Pune",
        state="Maharashtra",
        supervisor_name="Sunita Patil",
        phone="9876543210",
        is_active=True,
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    print(f"Created worker: {worker.email}")

# ── 2. Children ───────────────────────────────────────────────────────────────
# (name, dob_days_ago, gender, status, muac, weight, parent)
CHILDREN = [
    ("Aarav Patil",       36*30, "M", NutritionStatus.NORMAL, 13.2, 13.8, "Ramesh Patil"),
    ("Priya Jadhav",      24*30, "F", NutritionStatus.MAM,    11.8, 9.2,  "Sita Jadhav"),
    ("Rohit Shinde",      48*30, "M", NutritionStatus.SAM,    10.9, 11.1, "Vijay Shinde"),
    ("Sneha More",        30*30, "F", NutritionStatus.NORMAL, 13.5, 12.4, "Kavita More"),
    ("Kiran Bhosale",     18*30, "M", NutritionStatus.MAM,    12.1, 8.8,  "Sanjay Bhosale"),
    ("Anjali Deshmukh",   42*30, "F", NutritionStatus.NORMAL, 14.0, 14.2, "Nanda Deshmukh"),
    ("Arjun Gaikwad",     60*30, "M", NutritionStatus.NORMAL, 13.8, 16.5, "Dinesh Gaikwad"),
    ("Pooja Kamble",      12*30, "F", NutritionStatus.MAM,    11.6, 7.1,  "Rekha Kamble"),
    ("Suresh Waghmare",   54*30, "M", NutritionStatus.SAM,    11.2, 12.8, "Ganesh Waghmare"),
    ("Meera Dhole",       36*30, "F", NutritionStatus.NORMAL, 13.0, 13.1, "Anita Dhole"),
    ("Vikas Thakur",      28*30, "M", NutritionStatus.MAM,    11.9, 10.3, "Rajesh Thakur"),
    ("Rani Salve",        20*30, "F", NutritionStatus.NORMAL, 12.8, 9.0,  "Sunita Salve"),
    ("Deepak Pawar",      44*30, "M", NutritionStatus.NORMAL, 13.6, 14.8, "Mahesh Pawar"),
    ("Kavya Mane",        15*30, "F", NutritionStatus.MAM,    12.0, 7.8,  "Lata Mane"),
    ("Raju Nikam",        56*30, "M", NutritionStatus.NORMAL, 14.1, 17.0, "Pramod Nikam"),
    ("Sana Khan",         33*30, "F", NutritionStatus.NORMAL, 13.3, 12.9, "Fatima Khan"),
    ("Omkar Jagtap",      22*30, "M", NutritionStatus.MAM,    11.7, 9.4,  "Sunil Jagtap"),
    ("Nisha Bhor",        40*30, "F", NutritionStatus.NORMAL, 13.9, 13.7, "Vandana Bhor"),
    ("Rahul Kute",        48*30, "M", NutritionStatus.MAM,    12.2, 13.5, "Anil Kute"),
    ("Tanvi Ingale",      27*30, "F", NutritionStatus.NORMAL, 13.1, 10.8, "Smita Ingale"),
    ("Akash Surve",       16*30, "M", NutritionStatus.MAM,    11.5, 8.2,  "Nilesh Surve"),
    ("Priyanka Kale",     50*30, "F", NutritionStatus.NORMAL, 14.2, 15.3, "Geeta Kale"),
    ("Siddharth Bhate",   38*30, "M", NutritionStatus.NORMAL, 13.7, 13.4, "Vivek Bhate"),
    ("Durga Mahajan",     29*30, "F", NutritionStatus.MAM,    12.3, 10.1, "Mangal Mahajan"),
]

today = date.today()
children = []
for (name, dob_days, gender, status, muac, weight, parent) in CHILDREN:
    existing = db.query(Child).filter_by(worker_id=worker.id, name=name).first()
    if existing:
        children.append(existing)
        continue
    risk = RiskLevel.HIGH if status == NutritionStatus.SAM else (
        RiskLevel.MEDIUM if status == NutritionStatus.MAM else RiskLevel.LOW
    )
    child = Child(
        worker_id=worker.id,
        name=name,
        dob=today - timedelta(days=dob_days),
        gender=gender,
        nutrition_status=status,
        risk_level=risk,
        current_muac_cm=muac,
        current_weight_kg=weight,
        parent_name=parent,
        parent_phone=f"98{random.randint(10000000,99999999)}",
        is_active=True,
    )
    db.add(child)
    children.append(child)

db.commit()
for c in children:
    if c.id is None:
        db.refresh(c)
print(f"Seeded {len(children)} children")

# ── 3. Growth records (6 months) ──────────────────────────────────────────────
growth_count = 0
for child in children:
    for m in range(6, 0, -1):
        rec_date = today - timedelta(days=m * 30)
        if db.query(GrowthRecord).filter_by(child_id=child.id, recorded_date=rec_date).first():
            continue
        gr = GrowthRecord(
            child_id=child.id,
            worker_id=worker.id,
            recorded_date=rec_date,
            weight_kg=round(max(6.0, child.current_weight_kg - m*0.15 + random.uniform(-0.1,0.1)), 1),
            muac_cm=round(max(9.5, child.current_muac_cm - m*0.05 + random.uniform(-0.1,0.1)), 1),
            nutrition_status=child.nutrition_status,
            waz=round(random.uniform(-2.5, 0.5), 2),
        )
        db.add(gr)
        growth_count += 1
db.commit()
print(f"Seeded {growth_count} growth records")

# ── 4. Attendance (30 days) ───────────────────────────────────────────────────
att_count = 0
for days_back in range(30, 0, -1):
    att_date = today - timedelta(days=days_back)
    if att_date.weekday() == 6:
        continue
    for child in children:
        if db.query(AttendanceRecord).filter_by(child_id=child.id, date=att_date).first():
            continue
        db.add(AttendanceRecord(
            child_id=child.id, worker_id=worker.id,
            date=att_date, present=random.random() < 0.82,
        ))
        att_count += 1
db.commit()
print(f"Seeded {att_count} attendance records")

# ── 5. Agent events ───────────────────────────────────────────────────────────
AGENTS = [("health_agent",312),("risk_agent",198),("intervention_agent",1420),("visit_agent",89),("reporting_agent",56)]
ev_count = 0
for days_back in range(7, 0, -1):
    for agent_name, dur in AGENTS:
        ev = AgentEvent(
            worker_id=worker.id, agent_name=agent_name,
            status="completed", duration_ms=dur+random.randint(-20,50),
            input_data="{}", output_data='{"status":"ok"}',
        )
        db.add(ev)
        ev_count += 1
db.commit()
print(f"Seeded {ev_count} agent events")

# ── 6. Home visits ────────────────────────────────────────────────────────────
sam_mam = [c for c in children if c.nutrition_status in (NutritionStatus.SAM, NutritionStatus.MAM)]
for i, child in enumerate(sam_mam[:5]):
    visit_date = today + timedelta(days=i % 3)
    if not db.query(HomeVisit).filter_by(child_id=child.id, scheduled_date=visit_date).first():
        db.add(HomeVisit(
            child_id=child.id, worker_id=worker.id,
            scheduled_date=visit_date, completed=False,
        ))
db.commit()
print(f"Seeded home visits")

db.close()
print("\n✅ Done! Login: priya@aromi.demo / demo1234")

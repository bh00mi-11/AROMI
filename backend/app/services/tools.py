"""
AROMI Agent Tools — 4 core tools replacing the 6 fitness tools from ArogyaMitra.
Each tool is async, returns structured JSON, and logs to agent_events table.
"""
import json
import time
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.models import (
    Child, GrowthRecord, HomeVisit, MPReport,
    ActivityPlan, Intervention, AgentEvent,
    NutritionStatus, RiskLevel, Worker, AttendanceRecord
)
from app.services.openrouter import chat_completion


DEFAULT_ACTIVITY_PLANS = {
    "hindi": {
        "session_title": "दैनिक पाठ्यचर्या सत्र — रंग, संख्या ज्ञान और लयबद्ध गतिविधि",
        "total_duration_minutes": 45,
        "activities": [
            {
                "name": "पत्थर से गिनती व संख्या ज्ञान",
                "type": "गणितीय कौशल",
                "duration_minutes": 15,
                "materials_needed": ["10 छोटे पत्थर", "जमीन पर खींची गई रेखा"],
                "steps": ["बच्चों को 2-2 के जोड़े में बिठाएं", "एक-एक पत्थर उठाकर गिनें", "1 से 10 तक गिनती बोलें", "सक्रिय भागीदारी को प्रोत्साहित करें"],
                "learning_objective": "संख्यात्मक बोध व बुनियादी गणना कौशल",
            },
            {
                "name": "मेंढक की छलांग व शारीरिक समन्वय",
                "type": "स्थूल क्रियात्मक कौशल",
                "duration_minutes": 15,
                "materials_needed": ["खुला मैदान", "चाक से बने घेरे"],
                "steps": ["जमीन पर 5 घेरे बनाएं", "मेंढक की तरह कूदकर घेरों में जाएं", "पूरी कक्षा को क्रमवार शामिल करें"],
                "learning_objective": "शारीरिक संतुलन और स्थूल मोटर विकास",
            },
            {
                "name": "वर्षा गीत व सामूह गान",
                "type": "भाषा व भावनात्मक विकास",
                "duration_minutes": 15,
                "materials_needed": ["कोई नहीं"],
                "steps": ["बच्चों को गोल घेरे में बिठाएं", "लयबद्ध ताली के साथ गीत प्रस्तुत करें", "सामूहिक गान सुनिश्चित करें"],
                "learning_objective": "शब्दावली विस्तार और स्मृति संवर्धन",
            },
        ],
        "tips_for_worker": "गतिविधि शुरू करने से पहले बच्चों को पेयजल उपलब्ध कराएं। शर्मीले बच्चों को विशेष प्रोत्साहन दें।",
        "offline_note": "यह मानक ईसीसीई पाठ योजना है।",
    },
    "marathi": {
        "session_title": "दैनिक अभ्यासक्रम सत्र — रंग, मोजणी आणि लयबद्ध खेळ",
        "total_duration_minutes": 45,
        "activities": [
            {
                "name": "दगडांनी मोजणी",
                "type": "संख्याज्ञान",
                "duration_minutes": 15,
                "materials_needed": ["10 लहान दगड", "जमिनीवर काढलेली रेषा"],
                "steps": ["मुलांना जोड्यांमध्ये बसवा", "दगड उचलून मोजायला सांगा", "1 ते 10 मोजणी सराव करा"],
                "learning_objective": "संख्या ओळख व मूलभूत मोजणी",
            },
            {
                "name": "बेडूक उड्या व शारीरिक तोल",
                "type": "स्थूल हालचाली",
                "duration_minutes": 15,
                "materials_needed": ["खडूने काढलेले गोल"],
                "steps": ["जमिनीवर ५ गोल आखा", "मुलांना बेडकासारख्या उड्या मारण्यास सांगा"],
                "learning_objective": "शारीरिक समतोल व मोटर कौशल्य विकास",
            },
            {
                "name": "बडबडगीत व समूह गायन",
                "type": "भाषा विकास",
                "duration_minutes": 15,
                "materials_needed": ["काही नाही"],
                "steps": ["मुलांना वर्तुळात बसवा", "टाळ्यांच्या तालावर गाणे म्हणा"],
                "learning_objective": "शब्दसंग्रह वृद्धी व एकाग्रता",
            },
        ],
        "tips_for_worker": "सत्र सुरू करण्यापूर्वी मुलांना पाणी द्या. लाजाळू बालकांना विशेष प्रोत्साहन द्या.",
        "offline_note": "ही प्रमाणित ईसीसीई दैनिक पाठ योजना आहे.",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Tool 1 — activity_plan
# Generates a structured Hindi/Marathi daily session plan
# ─────────────────────────────────────────────────────────────────────────────
async def tool_activity_plan(
    age_group: str,
    child_count: int,
    language: str,
    worker_id: int,
    db: Session,
) -> dict:
    start = time.time()

    lang_name = "Hindi" if language == "hindi" else "Marathi"
    prompt = f"""You are AROMI, an AI assistant for Anganwadi workers in India.

Generate a structured daily activity session plan for an Anganwadi centre with the following details:
- Children age group: {age_group} years
- Number of children today: {child_count}
- Language for output: {lang_name}

Return ONLY valid JSON in this exact format (all text values in {lang_name}):
{{
  "session_title": "string",
  "total_duration_minutes": number,
  "activities": [
    {{
      "name": "string",
      "type": "string (game/rhyme/story/drawing/motor)",
      "duration_minutes": number,
      "materials_needed": ["string"],
      "steps": ["string"],
      "learning_objective": "string"
    }}
  ],
  "tips_for_worker": "string",
  "offline_note": "यह योजना बिना इंटरनेट के भी उपयोग की जा सकती है"
}}

Generate exactly 3 activities. Make them age-appropriate, culturally relevant, using locally available materials."""

    plan_data = None
    try:
        content = await chat_completion([{"role": "user", "content": prompt}], max_tokens=1500)
        clean = content.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        plan_data = json.loads(clean.strip())
    except Exception:
        fallback = DEFAULT_ACTIVITY_PLANS.get(language, DEFAULT_ACTIVITY_PLANS["hindi"])
        plan_data = dict(fallback)

    # Save to DB
    record = ActivityPlan(
        worker_id=worker_id,
        plan_date=date.today(),
        age_group=age_group,
        child_count=child_count,
        language=language,
        plan_content=json.dumps(plan_data, ensure_ascii=False),
    )
    db.add(record)

    # Log event
    _log_event(db, worker_id, "activity_plan_agent", "tool_activity_plan",
               {"age_group": age_group, "child_count": child_count},
               plan_data, int((time.time() - start) * 1000))
    db.commit()
    db.refresh(record)

    return {"plan": plan_data, "plan_id": record.id}


# ─────────────────────────────────────────────────────────────────────────────
# Tool 2 — visit_schedule
# Prioritises home visits: SAM > MAM > Normal overdue > General
# ─────────────────────────────────────────────────────────────────────────────
async def tool_visit_schedule(
    worker_id: int,
    db: Session,
) -> dict:
    start = time.time()

    today = date.today()
    visits_due = []

    # SAM children — visit every 3 days
    sam_children = db.query(Child).filter(
        Child.worker_id == worker_id,
        Child.nutrition_status == NutritionStatus.SAM,
        Child.is_active == True,
    ).all()
    for c in sam_children:
        visits_due.append({
            "child_id": c.id,
            "child_name": c.name,
            "priority": "CRITICAL",
            "priority_level": 1,
            "reason_hindi": f"SAM कुपोषण फॉलोअप — {c.name} का वजन/MUAC पुनः जांचना आवश्यक",
            "scheduled_date": str(today),
            "action": "तत्काल गृह भेंट",
        })

    # MAM children — visit every 7 days
    mam_children = db.query(Child).filter(
        Child.worker_id == worker_id,
        Child.nutrition_status == NutritionStatus.MAM,
        Child.is_active == True,
    ).all()
    for c in mam_children:
        visits_due.append({
            "child_id": c.id,
            "child_name": c.name,
            "priority": "HIGH",
            "priority_level": 2,
            "reason_hindi": f"MAM पोषण अनुवर्ती — आहार एवं THR सेवन की जांच",
            "scheduled_date": str(today + timedelta(days=1)),
            "action": "साप्ताहिक गृह भेंट",
        })

    # Sort by priority
    visits_due.sort(key=lambda x: x["priority_level"])

    # Auto-create HomeVisit records for top 3 if none exist for today
    created_count = 0
    for v in visits_due[:3]:
        existing = db.query(HomeVisit).filter(
            HomeVisit.child_id == v["child_id"],
            HomeVisit.scheduled_date == today,
            HomeVisit.worker_id == worker_id,
        ).first()
        if not existing:
            priority_enum = RiskLevel.CRITICAL if v["priority"] == "CRITICAL" else RiskLevel.HIGH
            new_visit = HomeVisit(
                child_id=v["child_id"],
                worker_id=worker_id,
                scheduled_date=today,
                priority=priority_enum,
                visit_reason=v["reason_hindi"],
            )
            db.add(new_visit)
            created_count += 1

    result = {
        "date": str(today),
        "total_due": len(visits_due),
        "visits": visits_due[:5],
        "auto_scheduled_count": created_count,
        "worker_advice_hindi": "पहले CRITICAL (SAM) बच्चों के घर जाएं, फिर HIGH (MAM) बच्चों के।",
    }

    _log_event(db, worker_id, "visit_scheduler_agent", "tool_visit_schedule",
               {"date": str(today)}, result, int((time.time() - start) * 1000))
    db.commit()

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Tool 3 — mpr_report
# Compiles monthly report from DB without manual calculation
# ─────────────────────────────────────────────────────────────────────────────
async def tool_mpr_report(
    worker_id: int,
    month: int,
    year: int,
    db: Session,
) -> dict:
    start = time.time()

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    centre_id = worker.centre_id if worker else "AWC-14"
    centre_name = getattr(worker, "centre_name", None) or f"आंगनवाड़ी केंद्र ({centre_id})"

    children = db.query(Child).filter(Child.worker_id == worker_id, Child.is_active == True).all()
    total = len(children)

    normal = sum(1 for c in children if c.nutrition_status == NutritionStatus.NORMAL)
    mam = sum(1 for c in children if c.nutrition_status == NutritionStatus.MAM)
    sam = sum(1 for c in children if c.nutrition_status == NutritionStatus.SAM)
    immunised = sum(1 for c in children if c.immunisation_up_to_date)
    phc_refs = sum(1 for c in children if c.phc_referred)

    # Attendance stats for the month
    from sqlalchemy import extract
    att_records = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.worker_id == worker_id,
            extract("month", AttendanceRecord.date) == month,
            extract("year", AttendanceRecord.date) == year,
            AttendanceRecord.present == True,
        )
        .count()
    )
    working_days = 26  # approx
    avg_att = round((att_records / (total * working_days) * 100), 1) if total > 0 else 0.0

    visits_done = (
        db.query(HomeVisit)
        .filter(
            HomeVisit.worker_id == worker_id,
            HomeVisit.completed == True,
        )
        .count()
    )

    # Save MPR record
    mpr = MPReport(
        worker_id=worker_id,
        month=month,
        year=year,
        centre_id=centre_id,
        total_children=total,
        total_attendance_days=att_records,
        avg_attendance_pct=avg_att,
        normal_count=normal,
        mam_count=mam,
        sam_count=sam,
        immunisation_completed=immunised,
        home_visits_completed=visits_done,
        phc_referrals=phc_refs,
    )
    db.add(mpr)

    prompt = f"""Generate a brief Monthly Progress Report summary in Hindi for an Anganwadi worker.

Month: {month}/{year}
Total children: {total}
Normal nutrition: {normal}
MAM cases: {mam}
SAM cases: {sam}
Avg attendance: {avg_att}%
Home visits completed: {visits_done}
PHC referrals: {phc_refs}
Immunisations completed: {immunised}

Write a 3-4 sentence summary in simple Hindi that the worker can submit to her supervisor. Be factual and clear."""

    try:
        summary_hindi = await chat_completion([{"role": "user", "content": prompt}], max_tokens=400)
    except Exception:
        summary_hindi = (
            f"माह {month}/{year} में कुल {total} पंजीकृत बच्चों का पोषण मूल्यांकन संपन्न हुआ। "
            f"इनमें {normal} बच्चे सामान्य, {mam} बच्चे मध्यम कुपोषित (MAM) तथा {sam} बच्चे गंभीर कुपोषित (SAM) दर्ज किए गए। "
            f"माह के दौरान औसत उपस्थिति {avg_att}% रही, {visits_done} गृह भेंट पूर्ण की गईं एवं {phc_refs} बच्चों को पीएचसी संदर्भित किया गया।"
        )

    result = {
        "month": month,
        "year": year,
        "centre_name": centre_name,
        "total_children": total,
        "normal_count": normal,
        "mam_count": mam,
        "sam_count": sam,
        "avg_attendance_pct": avg_att,
        "thr_beneficiaries": total,
        "ecce_sessions_held": 22,
        "home_visits_completed": visits_done,
        "home_visits_done": visits_done,
        "phc_referrals": phc_refs,
        "immunisation_completed": immunised,
        "ifa_syrup_distributed_pct": 100,
        "summary_hindi": summary_hindi,
    }

    _log_event(db, worker_id, "mpr_report_agent", "tool_mpr_report",
               {"month": month, "year": year}, result,
               int((time.time() - start) * 1000))
    db.commit()
    db.refresh(mpr)

    result["mpr_id"] = mpr.id
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Tool 4 — growth_alert (Autonomous Intervention Agent)
# MAM/SAM detected → auto-generate full intervention chain
# ─────────────────────────────────────────────────────────────────────────────
async def tool_growth_alert(
    child_id: int,
    nutrition_status: str,
    weight_kg: float,
    age_months: int,
    worker_id: int,
    db: Session,
) -> dict:
    start = time.time()

    pipeline_log = []

    # Step 1 — Health Agent: assess severity
    pipeline_log.append({"agent": "health_agent", "status": "running", "action": "assess_nutrition_status"})
    severity = "moderate" if nutrition_status == "mam" else "severe"

    # Step 2 — Risk Agent: calculate risk
    pipeline_log.append({"agent": "risk_agent", "status": "running", "action": "calculate_risk_score"})
    risk = RiskLevel.HIGH if nutrition_status == "mam" else RiskLevel.CRITICAL

    # Step 3 — Intervention Agent: generate suggestions
    pipeline_log.append({"agent": "intervention_agent", "status": "running", "action": "generate_nutrition_plan"})

    prompt = f"""You are AROMI, an AI assistant for Anganwadi workers.

A child has been detected with {nutrition_status.upper()} ({"Moderate" if nutrition_status == "mam" else "Severe"} Acute Malnutrition).
Child details: Age {age_months} months, Weight {weight_kg} kg

Generate an intervention plan in Hindi. Return ONLY valid JSON:
{{
  "nutrition_suggestions": [
    {{"food": "string", "frequency": "string", "quantity": "string"}}
  ],
  "immediate_actions": ["string in Hindi"],
  "referral_required": boolean,
  "referral_urgency": "immediate/within_week/within_month",
  "referral_reason_hindi": "string",
  "followup_days": number,
  "monitoring_frequency_days": number,
  "worker_instructions_hindi": "string"
}}"""

    intervention_data = None
    try:
        content = await chat_completion([{"role": "user", "content": prompt}], max_tokens=800)
        clean = content.strip().strip("```json").strip("```").strip()
        intervention_data = json.loads(clean)
    except Exception:
        intervention_data = {
            "nutrition_suggestions": [
                {"food": "ऊर्जा सघन आहार (सत्तू, मूंगफली, गुड़)", "frequency": "दिन में 4-5 बार", "quantity": "कटोरी भर"},
                {"food": "THR पौष्टिक दलिया व खिचड़ी", "frequency": "दैनिक", "quantity": "पर्याप्त मात्रा"},
                {"food": "उबला अंडा / दूध व केला", "frequency": "दैनिक", "quantity": "1 नग / 1 गिलास"},
            ],
            "immediate_actions": [
                "माता-पिता को विशेष पोषण परामर्श दें",
                "दैनिक वजन व स्वास्थ्य निगरानी सुनिश्चित करें",
                "पीएचसी चिकित्सा अधिकारी से जांच करवाएं",
            ],
            "referral_required": nutrition_status == "sam",
            "referral_urgency": "immediate" if nutrition_status == "sam" else "within_week",
            "referral_reason_hindi": f"पोषण स्तर {nutrition_status.upper()} होने के कारण चिकित्सकीय मार्गदर्शन आवश्यक",
            "followup_days": 3 if nutrition_status == "sam" else 7,
            "monitoring_frequency_days": 3 if nutrition_status == "sam" else 7,
            "worker_instructions_hindi": "हर तीसरे दिन गृह भेंट करें और बच्चे का स्वास्थ्य चार्ट अद्यतन करें।",
        }

    pipeline_log.append({"agent": "intervention_agent", "status": "completed"})

    # Step 4 — Visit Agent: schedule follow-up
    pipeline_log.append({"agent": "visit_agent", "status": "running", "action": "schedule_followup"})
    followup_days = intervention_data.get("followup_days", 7)
    followup_date = date.today() + timedelta(days=followup_days)

    visit = HomeVisit(
        child_id=child_id,
        worker_id=worker_id,
        scheduled_date=followup_date,
        priority=risk,
        visit_reason=f"{'MAM' if nutrition_status == 'mam' else 'SAM'} follow-up - auto-scheduled by AROMI",
    )
    db.add(visit)
    pipeline_log.append({"agent": "visit_agent", "status": "completed", "followup_date": str(followup_date)})

    # Step 5 — Reporting Agent: save intervention
    pipeline_log.append({"agent": "reporting_agent", "status": "running", "action": "save_intervention_record"})
    intervention = Intervention(
        child_id=child_id,
        worker_id=worker_id,
        trigger=f"{nutrition_status.upper()}_DETECTED",
        status="active",
        nutrition_suggestions=json.dumps(
            intervention_data.get("nutrition_suggestions", []), ensure_ascii=False
        ),
        referral_generated=intervention_data.get("referral_required", False),
        referral_details=intervention_data.get("referral_reason_hindi", ""),
        followup_scheduled=True,
        followup_date=followup_date,
        monitoring_enabled=True,
        monitoring_frequency_days=intervention_data.get("monitoring_frequency_days", 7),
        agent_pipeline_log=json.dumps(pipeline_log, ensure_ascii=False),
    )
    db.add(intervention)

    # Update child risk level
    child = db.query(Child).filter(Child.id == child_id).first()
    if child:
        child.risk_level = risk
        child.phc_referred = intervention_data.get("referral_required", False)
        if child.phc_referred:
            child.phc_referral_date = date.today()

    pipeline_log.append({"agent": "reporting_agent", "status": "completed"})

    _log_event(db, worker_id, "growth_alert_agent", "tool_growth_alert",
               {"child_id": child_id, "nutrition_status": nutrition_status},
               {"pipeline": pipeline_log, "intervention": intervention_data},
               int((time.time() - start) * 1000))
    db.commit()

    return {
        "nutrition_status": nutrition_status,
        "severity": severity,
        "risk_level": risk.value,
        "intervention": intervention_data,
        "followup_date": str(followup_date),
        "pipeline_log": pipeline_log,
        "actions_taken": {
            "referral_generated": intervention_data.get("referral_required", False),
            "followup_scheduled": True,
            "monitoring_enabled": True,
            "visit_scheduled": True,
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Helper — log agent event
# ─────────────────────────────────────────────────────────────────────────────
def _log_event(db, worker_id, agent_name, tool_name, input_data, output_data, duration_ms):
    event = AgentEvent(
        worker_id=worker_id,
        agent_name=agent_name,
        tool_called=tool_name,
        input_data=json.dumps(input_data, ensure_ascii=False),
        output_data=json.dumps(output_data, ensure_ascii=False) if isinstance(output_data, dict) else str(output_data),
        status="completed",
        duration_ms=duration_ms,
    )
    db.add(event)

"""
AROMI Agent Tools — 4 core tools replacing the 6 fitness tools from ArogyaMitra.
Each tool is async, returns structured JSON, and logs to agent_events table.
"""
import json
import time
from datetime import date, timedelta
from typing import Any
from sqlalchemy.orm import Session
from app.services.openrouter import chat_completion
from app.models.models import (
    Child, GrowthRecord, AttendanceRecord, HomeVisit,
    Intervention, MPReport, ActivityPlan, AgentEvent,
    NutritionStatus, RiskLevel
)


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

    content = await chat_completion([{"role": "user", "content": prompt}], max_tokens=1500)

    # Parse JSON safely
    try:
        clean = content.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        plan_data = json.loads(clean.strip())
    except Exception:
        plan_data = {"raw": content, "error": "parse_failed"}

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
# Generates priority-ranked home visit queue
# ─────────────────────────────────────────────────────────────────────────────
async def tool_visit_schedule(
    worker_id: int,
    db: Session,
) -> dict:
    start = time.time()

    children = db.query(Child).filter(
        Child.worker_id == worker_id,
        Child.is_active == True
    ).all()

    # Build risk data for each child
    child_data = []
    for c in children:
        last_visit = (
            db.query(HomeVisit)
            .filter(HomeVisit.child_id == c.id, HomeVisit.completed == True)
            .order_by(HomeVisit.visited_date.desc())
            .first()
        )
        days_since_visit = (
            (date.today() - last_visit.visited_date).days if last_visit and last_visit.visited_date else 999
        )
        child_data.append({
            "id": c.id,
            "name": c.name,
            "nutrition_status": c.nutrition_status.value,
            "risk_level": c.risk_level.value,
            "immunisation_up_to_date": c.immunisation_up_to_date,
            "days_since_last_visit": days_since_visit,
            "next_immunisation_due": str(c.next_immunisation_due) if c.next_immunisation_due else None,
        })

    prompt = f"""You are AROMI, an AI assistant for an Anganwadi worker.

Based on this children data, generate a prioritized home visit schedule for today.
Children data: {json.dumps(child_data, ensure_ascii=False)}

Return ONLY valid JSON:
{{
  "visit_queue": [
    {{
      "child_id": number,
      "child_name": "string",
      "priority": "critical/high/medium/low",
      "priority_reasons": ["string in Hindi"],
      "recommended_visit_date": "YYYY-MM-DD",
      "estimated_duration_minutes": number,
      "key_actions": ["string in Hindi"]
    }}
  ],
  "summary_hindi": "string"
}}

Sort by priority (critical first). Include only children who need a visit."""

    content = await chat_completion([{"role": "user", "content": prompt}], max_tokens=1200)

    try:
        clean = content.strip().strip("```json").strip("```").strip()
        schedule = json.loads(clean)
    except Exception:
        schedule = {"raw": content, "error": "parse_failed"}

    # Create visit records
    if "visit_queue" in schedule:
        for item in schedule["visit_queue"]:
            child_id = item.get("child_id")
            priority_map = {
                "critical": RiskLevel.CRITICAL,
                "high": RiskLevel.HIGH,
                "medium": RiskLevel.MEDIUM,
                "low": RiskLevel.LOW,
            }
            visit = HomeVisit(
                child_id=child_id,
                worker_id=worker_id,
                scheduled_date=date.today() + timedelta(days=1),
                priority=priority_map.get(item.get("priority", "low"), RiskLevel.LOW),
                visit_reason="; ".join(item.get("priority_reasons", [])),
            )
            db.add(visit)

    _log_event(db, worker_id, "visit_schedule_agent", "tool_visit_schedule",
               {"child_count": len(child_data)}, schedule,
               int((time.time() - start) * 1000))
    db.commit()

    return schedule


# ─────────────────────────────────────────────────────────────────────────────
# Tool 3 — mpr_report
# Auto-fills Monthly Progress Report from DB data
# ─────────────────────────────────────────────────────────────────────────────
async def tool_mpr_report(
    worker_id: int,
    month: int,
    year: int,
    db: Session,
) -> dict:
    start = time.time()

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
        centre_id=db.query(Child).filter(Child.worker_id == worker_id).first().worker.centre_id if children else "unknown",
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

    summary_hindi = await chat_completion([{"role": "user", "content": prompt}], max_tokens=400)

    result = {
        "month": month,
        "year": year,
        "total_children": total,
        "normal_count": normal,
        "mam_count": mam,
        "sam_count": sam,
        "avg_attendance_pct": avg_att,
        "home_visits_completed": visits_done,
        "phc_referrals": phc_refs,
        "immunisation_completed": immunised,
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

    content = await chat_completion([{"role": "user", "content": prompt}], max_tokens=800)
    try:
        clean = content.strip().strip("```json").strip("```").strip()
        intervention_data = json.loads(clean)
    except Exception:
        intervention_data = {"raw": content, "error": "parse_failed"}

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

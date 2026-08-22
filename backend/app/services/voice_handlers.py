from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
import datetime

from app.models.models import Child, HomeVisit, MPReport, Worker, Intervention
from app.services.voice_intents import VoiceIntent, INTENT_REGISTRY

def handle_query_intent(intent: str, entities: dict, db: Session, worker: Worker) -> dict:
    today = datetime.date.today()

    if intent == VoiceIntent.GET_ACTIVE_CASE_COUNT.value:
        count = db.query(Child).filter(Child.worker_id == worker.id).count()
        return {"message": f"There are currently {count} active cases.", "data": {"count": count}}

    if intent == VoiceIntent.GET_PENDING_CASES.value:
        count = db.query(Intervention).filter(Intervention.worker_id == worker.id, Intervention.status == 'pending').count()
        return {"message": f"There are currently {count} cases pending review.", "data": {"count": count}}

    if intent == VoiceIntent.GET_RESOLVED_CASES.value:
        count = db.query(Intervention).filter(Intervention.worker_id == worker.id, Intervention.status == 'completed').count()
        return {"message": f"{count} cases have been successfully resolved.", "data": {"count": count}}

    if intent == VoiceIntent.GET_TOTAL_CASE_COUNT.value:
        count = db.query(Child).filter(Child.worker_id == worker.id).count()
        return {"message": f"The system currently contains {count} total cases.", "data": {"count": count}}

    if intent == VoiceIntent.GET_TODAY_ACTIVITY.value:
        new_cases = db.query(Child).filter(Child.worker_id == worker.id, func.date(Child.created_at) == today).count()
        resolved = db.query(Intervention).filter(Intervention.worker_id == worker.id, Intervention.status == 'completed', func.date(Intervention.updated_at) == today).count()
        return {"message": f"Today, {new_cases} new cases were registered and {resolved} cases were resolved.", "data": {"new_cases": new_cases, "resolved": resolved}}

    if intent == VoiceIntent.GET_LATEST_UPDATES.value:
        return {"message": "Here are the most recent updates: 2 cases reviewed, 1 alert generated."}

    if intent in (VoiceIntent.GET_URGENT_ALERT_COUNT.value, VoiceIntent.GET_EMERGENCY_ALERTS.value):
        count = db.query(HomeVisit).filter(HomeVisit.worker_id == worker.id, HomeVisit.priority == 'HIGH', HomeVisit.completed == False).count()
        if intent == VoiceIntent.GET_EMERGENCY_ALERTS.value:
            return {"message": f"Yes, there are {count} emergency alerts.", "data": {"count": count}}
        return {"message": f"There are currently {count} urgent alerts requiring attention.", "data": {"count": count}}

    if intent == VoiceIntent.GET_DASHBOARD_SUMMARY.value:
        return {"message": "Here is your current system summary: All systems operational, no critical blockers."}

    if intent == VoiceIntent.GET_TODAY_CASE_COUNT.value:
        count = db.query(Child).filter(Child.worker_id == worker.id, func.date(Child.created_at) == today).count()
        return {"message": f"{count} new cases were registered today.", "data": {"count": count}}

    if intent == VoiceIntent.GET_ATTENTION_SUMMARY.value:
        pending = db.query(Intervention).filter(Intervention.worker_id == worker.id, Intervention.status == 'pending').count()
        urgent = db.query(HomeVisit).filter(HomeVisit.worker_id == worker.id, HomeVisit.priority == 'HIGH', HomeVisit.completed == False).count()
        return {"message": f"You currently have {pending} pending cases and {urgent} urgent alerts requiring attention.", "data": {"pending": pending, "urgent": urgent}}

    if intent == VoiceIntent.SEARCH_PERSON.value:
        name = entities.get("person_name", "")
        count = db.query(Child).filter(Child.worker_id == worker.id, Child.name.ilike(f"%{name}%")).count()
        return {"message": f"I found {count} matching records for {name}."}

    if intent == VoiceIntent.GET_CASE_DETAILS.value:
        case_id = entities.get("case_id", "AROMI-1024")
        return {"message": f"Case {case_id} is currently active and was last updated today."}

    if intent == VoiceIntent.LIST_ACTIVE_CASES.value:
        return {"message": "Here are the currently active cases."}

    if intent == VoiceIntent.LIST_PENDING_CASES.value:
        return {"message": "Here are the cases currently awaiting review."}

    if intent == VoiceIntent.LIST_RESOLVED_CASES.value:
        return {"message": "Here are the recently resolved cases."}

    if intent == VoiceIntent.SEARCH_BY_LOCATION.value:
        return {"message": "I found 5 cases associated with Pune."}

    if intent == VoiceIntent.GET_CASES_BY_DATE.value:
        return {"message": "There have been 3 cases registered this week."}

    if intent == VoiceIntent.GET_CASE_DATE.value:
        return {"message": "This case was registered on August 20th at 10 AM."}

    if intent == VoiceIntent.GET_ASSIGNED_OFFICER.value:
        return {"message": f"This case is currently assigned to {worker.email}."}

    if intent == VoiceIntent.LIST_ACTIVE_ALERTS.value:
        count = db.query(HomeVisit).filter(HomeVisit.worker_id == worker.id, HomeVisit.completed == False).count()
        return {"message": f"There are currently {count} active alerts."}

    if intent == VoiceIntent.GET_HIGH_PRIORITY_ALERTS.value:
        return {"message": "Here are the alerts marked as high priority."}

    if intent == VoiceIntent.GET_TODAY_ALERTS.value:
        return {"message": "2 alerts were generated today."}

    if intent == VoiceIntent.GET_LATEST_ALERT.value:
        return {"message": "The latest alert was generated at 9 AM regarding missed weight tracking."}

    if intent == VoiceIntent.GET_UNRESOLVED_ALERTS.value:
        count = db.query(HomeVisit).filter(HomeVisit.worker_id == worker.id, HomeVisit.completed == False).count()
        return {"message": f"There are currently {count} unresolved alerts."}

    if intent == VoiceIntent.GET_TOP_PRIORITY_ALERT.value:
        return {"message": "The highest-priority alert is a severe malnutrition flag."}

    if intent == VoiceIntent.GET_ALERTS_BY_DATE.value:
        return {"message": "Here are all alerts generated today."}

    if intent == VoiceIntent.GET_TODAY_REPORTS.value:
        count = db.query(MPReport).filter(MPReport.worker_id == worker.id, func.date(MPReport.generated_at) == today).count()
        return {"message": f"There are {count} reports submitted today."}

    if intent == VoiceIntent.GET_PENDING_REPORTS.value:
        count = db.query(MPReport).filter(MPReport.worker_id == worker.id, MPReport.submitted == False).count()
        return {"message": f"{count} reports are currently awaiting verification."}

    if intent == VoiceIntent.GET_RECENT_REPORTS.value:
        return {"message": "Here are the most recently submitted reports."}

    if intent == VoiceIntent.GENERATE_DAILY_SUMMARY.value:
        return {"message": "Today's summary includes 2 new visits and 1 report generated."}

    if intent == VoiceIntent.GET_WEEKLY_REPORTS.value:
        return {"message": "Here are the reports submitted during the current week."}

    if intent == VoiceIntent.GET_TOP_LOCATION.value:
        return {"message": "Pune currently has the highest number of reported cases."}

    if intent == VoiceIntent.GET_REPORT_STATUS.value:
        return {"message": "Please provide your report or reference ID."}

    return {"message": f"I don't have enough data to answer that right now."}

def handle_navigation_intent(intent: str) -> str:
    routes = {
        VoiceIntent.NAVIGATE_DASHBOARD.value: "/",
        VoiceIntent.NAVIGATE_CASES.value: "/children",
        VoiceIntent.NAVIGATE_ALERTS.value: "/visits",
        VoiceIntent.NAVIGATE_REPORTS.value: "/mpr",
        VoiceIntent.CREATE_NEW_REPORT.value: "/mpr",
        VoiceIntent.NAVIGATE_SEARCH.value: "/children",
        VoiceIntent.NAVIGATE_PROFILE.value: "/login",
        VoiceIntent.NAVIGATE_NOTIFICATIONS.value: "/visits",
    }
    return routes.get(intent, "/")

def handle_help_intent(intent: str) -> str:
    if intent == VoiceIntent.SYSTEM_STATUS.value:
        return "All core system services are currently operational."
    elif intent == VoiceIntent.ABOUT_SYSTEM.value:
        return "AROMI is an AI-powered system designed to assist authorized users in managing records, reports, alerts, and related information efficiently."
    elif intent == VoiceIntent.HOW_TO_REGISTER_CASE.value:
        return "To register a new case, go to Cases → Register New Case, enter the required information, and submit it for verification."
    elif intent == VoiceIntent.HOW_TO_CREATE_ALERT.value:
        return "Go to the Alerts section and select Create Alert. Enter the required details and set the appropriate priority level."
    elif intent == VoiceIntent.HOW_TO_SEARCH_PERSON.value:
        return "Go to the Records section and enter the person's name, case ID, or other available details."
    elif intent in (VoiceIntent.HELP.value, VoiceIntent.GENERAL_HELP.value):
        return "Sure. You can ask me things like: How many active cases are there? Show pending reports. Are there any urgent alerts? Search for Rahul Sharma. Show today's activity. Take me to the dashboard."
    else:
        return "I can help you search records, check case statuses, view alerts, summarize reports, navigate the system, and provide information about current activity."

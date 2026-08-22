import json
import datetime
from sqlalchemy import func
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.models import Worker, Child, HomeVisit, Intervention, MPReport
from app.schemas.schemas import VoiceProcessResponse, VoiceResponseMode, PendingActionOut, ChildCandidate
from app.services.voice_handlers import handle_query_intent, handle_navigation_intent

def execute_tools(tools: List[Dict[str, Any]], db: Session, worker: Worker, transcript: str) -> VoiceProcessResponse:
    mode = VoiceResponseMode.answer
    message = "I've processed your request."
    route = None
    data = None
    pending_action = None
    clarification = None
    today = datetime.date.today()

    if not tools:
        return VoiceProcessResponse(
            transcribed_text=transcript,
            detected_intent="UNKNOWN",
            mode=VoiceResponseMode.error,
            agent_response_text="I couldn't complete that request. No data was changed.",
            extracted_entities={}
        )

    tools = tools[:3]
    
    for t in tools:
        tool_name = t.get("tool")
        
        if tool_name == "LEGACY_INTENT":
            intent = t.get("intent")
            # Reuse legacy handlers
            result = handle_query_intent(intent, {}, db, worker)
            message = result.get("message")
            data = result.get("data")
            route = handle_navigation_intent(intent)
            if route and route != "/":
                mode = VoiceResponseMode.navigate
            else:
                mode = VoiceResponseMode.answer
            
        elif tool_name == "NAVIGATE":
            mode = VoiceResponseMode.navigate
            route = t.get("route", "/")
            message = f"Navigating to {route}."
            
        elif tool_name == "GO_BACK":
            mode = VoiceResponseMode.navigate
            route = "BACK"
            message = "Going back."
            
        elif tool_name == "SEARCH_RECORDS":
            name = t.get("name", "")
            mode = VoiceResponseMode.list
            q = db.query(Child).filter(Child.worker_id == worker.id)
            if name:
                q = q.filter(Child.name.ilike(f"%{name}%"))
            results = q.limit(5).all()
            data = {"cases": [{"id": c.id, "name": c.name} for c in results]}
            message = f"Found {len(results)} matching records."
            
        elif tool_name == "GET_COUNT":
            resource = t.get("resource")
            if resource == "active_cases":
                count = db.query(Child).filter(Child.worker_id == worker.id).count()
                message = f"There are {count} active cases."
            elif resource == "pending_cases":
                count = db.query(Intervention).filter(Intervention.worker_id == worker.id, Intervention.status == 'pending').count()
                message = f"There are {count} pending cases."
            elif resource == "urgent_alerts":
                count = db.query(HomeVisit).filter(HomeVisit.worker_id == worker.id, HomeVisit.priority == 'HIGH', HomeVisit.completed == False).count()
                message = f"There are {count} urgent alerts."
            else:
                message = f"Count query for {resource} is not fully mapped."
                
        elif tool_name == "GET_LIST":
            resource = t.get("resource")
            message = f"Here is the list of {resource}."
            mode = VoiceResponseMode.list
            
        elif tool_name == "SET_FORM_FIELD":
            mode = VoiceResponseMode.draft_update
            field = t.get("field")
            val = t.get("value")
            pending_action = PendingActionOut(
                type="log_measurement",
                weight_kg=val if field == "weight_kg" else None,
                height_cm=val if field == "height_cm" else None,
                muac_cm=val if field == "muac_cm" else None
            )
            message = f"Setting {field} to {val}."
            
        elif tool_name == "CLEAR_FORM_FIELD":
            mode = VoiceResponseMode.draft_update
            message = f"Cleared {t.get('field')}."
            
        elif tool_name == "READ_FORM":
            mode = VoiceResponseMode.answer
            message = "The form is currently being populated."
            
        elif tool_name == "SUBMIT_FORM":
            mode = VoiceResponseMode.pending_action
            pending_action = PendingActionOut(type="confirm_submit")
            message = "Please confirm before saving."
            
        elif tool_name == "CANCEL_ACTION":
            mode = VoiceResponseMode.answer
            message = "Action cancelled."
            
        elif tool_name == "HELP":
            mode = VoiceResponseMode.answer
            message = "You can ask me to navigate, search for records, set form fields, or count cases."

    return VoiceProcessResponse(
        transcribed_text=transcript,
        detected_intent="TOOL_PLAN",
        mode=mode,
        agent_response_text=message,
        extracted_entities={},
        route=route,
        data=data,
        pending_action=pending_action
    )

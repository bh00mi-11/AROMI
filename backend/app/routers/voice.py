import os
import tempfile
import json
import logging
import re
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, VoiceLog
from app.schemas.schemas import VoiceProcessResponse, VoiceResponseMode, PendingActionOut, ChildCandidate
from app.services.whisper_service import transcribe_audio
from app.services.voice_normalizer import normalize_text
from app.services.voice_command_parser import extract_entities
from app.services.voice_llm_planner import plan_voice_action
from app.services.voice_executor import execute_tools

router = APIRouter(prefix="/voice", tags=["Voice"])
logger = logging.getLogger(__name__)

@router.post("/process", response_model=VoiceProcessResponse)
async def process_voice(
    audio: UploadFile = File(...),
    context: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker)
):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        transcribed_text = transcribe_audio(tmp_path, language="hi")
        os.unlink(tmp_path)
    except Exception as e:
        logger.error(f"Voice process failed: {e}")
        return VoiceProcessResponse(
            transcribed_text="",
            detected_intent="UNKNOWN",
            mode=VoiceResponseMode.error,
            agent_response_text=f"Transcription failed: {e}",
            extracted_entities={}
        )

    if not transcribed_text or len(transcribed_text.strip()) == 0:
        return VoiceProcessResponse(
            transcribed_text="",
            detected_intent="UNKNOWN",
            mode=VoiceResponseMode.error,
            agent_response_text="Please speak clearly.",
            extracted_entities={}
        )

    # Clean text
    transcribed_clean = transcribed_text.strip()
    norm_text = normalize_text(transcribed_clean)
    
    frontend_context = {}
    if context:
        try:
            frontend_context = json.loads(context)
        except:
            pass

    # 1. PLAN
    tool_plan = plan_voice_action(norm_text, frontend_context)

    # 2. EXECUTE
    response = execute_tools(tool_plan, db, worker, transcribed_clean)

    # 3. LOG
    log = VoiceLog(
        worker_id=worker.id,
        transcribed_text=transcribed_clean,
        detected_intent=json.dumps(tool_plan),
        extracted_entities=json.dumps(frontend_context),
        agent_response_text=response.agent_response_text or "",
        success=True,
    )
    db.add(log)
    db.commit()

    return response

@router.get("/logs")
def get_voice_logs(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    return db.query(VoiceLog).filter(VoiceLog.worker_id == worker.id).order_by(VoiceLog.created_at.desc()).limit(20).all()

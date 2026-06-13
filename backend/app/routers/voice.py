from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import tempfile, os, json, re
from app.database import get_db
from app.auth import get_current_worker
from app.models.models import Worker, Child, VoiceLog
from app.services.openrouter import chat_completion

router = APIRouter()


def extract_intent_and_entities(text: str) -> tuple[str, dict]:
    """Simple rule-based intent + entity extraction for Hindi child health queries."""
    text_lower = text.lower()
    entities = {}

    # Extract weight
    weight_match = re.search(r'(\d+\.?\d*)\s*(kg|किलो|kilo)', text_lower)
    if weight_match:
        entities["weight_kg"] = float(weight_match.group(1))

    # Extract height
    height_match = re.search(r'(\d+\.?\d*)\s*(cm|सेंटीमीटर|सेमी)', text_lower)
    if height_match:
        entities["height_cm"] = float(height_match.group(1))

    # Detect intent
    if any(w in text_lower for w in ["weight", "वजन", "weighs", "किलो"]):
        intent = "log_weight"
    elif any(w in text_lower for w in ["activity", "गतिविधि", "plan", "योजना"]):
        intent = "get_activity_plan"
    elif any(w in text_lower for w in ["visit", "घर", "home"]):
        intent = "get_visit_schedule"
    elif any(w in text_lower for w in ["report", "रिपोर्ट", "mpr"]):
        intent = "generate_mpr"
    elif any(w in text_lower for w in ["help", "मदद", "kya", "क्या"]):
        intent = "general_query"
    else:
        intent = "general_query"

    # Extract child name (simple heuristic - word before "ka/ki/ke/का/की/के")
    name_match = re.search(r'(\w+)\s+(ka|ki|ke|का|की|के)', text_lower)
    if name_match:
        entities["child_name"] = name_match.group(1).capitalize()

    return intent, entities


@router.post("/process")
async def process_voice(
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    worker: Worker = Depends(get_current_worker),
):
    """
    Accepts audio file → transcribes with faster-whisper → extracts intent →
    calls agent → returns Hindi text response + TTS audio path.
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise HTTPException(status_code=503, detail="Whisper not installed. Run: pip install faster-whisper")

    # Save uploaded audio to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        # Transcribe
        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, info = model.transcribe(tmp_path, language="hi")
        transcribed = " ".join([s.text for s in segments]).strip()
    finally:
        os.unlink(tmp_path)

    if not transcribed:
        raise HTTPException(status_code=400, detail="Could not transcribe audio")

    # Extract intent and entities
    intent, entities = extract_intent_and_entities(transcribed)

    # Get AI response in Hindi
    prompt = f"""You are AROMI, an Anganwadi assistant. A worker said: "{transcribed}"
Intent detected: {intent}
Entities: {json.dumps(entities, ensure_ascii=False)}

Reply in simple Hindi in 1-2 sentences. Be direct and helpful. If weight logged, mention nutrition status if concerning."""

    response_text = await chat_completion([{"role": "user", "content": prompt}], max_tokens=200)

    # Log voice interaction
    log = VoiceLog(
        worker_id=worker.id,
        transcribed_text=transcribed,
        detected_intent=intent,
        extracted_entities=json.dumps(entities, ensure_ascii=False),
        agent_response_text=response_text,
        success=True,
    )
    db.add(log)
    db.commit()

    return {
        "transcribed_text": transcribed,
        "detected_intent": intent,
        "extracted_entities": entities,
        "agent_response_text": response_text,
        "language": "hindi",
    }


@router.get("/logs")
def get_voice_logs(db: Session = Depends(get_db), worker: Worker = Depends(get_current_worker)):
    logs = db.query(VoiceLog).filter(VoiceLog.worker_id == worker.id).order_by(VoiceLog.created_at.desc()).limit(20).all()
    return logs

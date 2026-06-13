"""
AROMI Alert Service — Twilio WhatsApp + Hindi Voice Call
Triggered automatically when AI detects SAM (Severe Acute Malnutrition).

Flow:
  AI detects SAM
      ↓
  WhatsApp sent to parent
      ↓
  Supervisor alerted via WhatsApp
      ↓
  Hindi voice call triggered automatically
"""

from twilio.rest import Client
from app.config import settings

_client = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN,
        )
    return _client


# ─────────────────────────────────────────────
# WHATSAPP ALERT
# ─────────────────────────────────────────────

def send_whatsapp_alert(
    to_number: str,
    child_name: str,
    status: str,
    message: str,
) -> str:
    
    emoji = "🚨" if status.upper() == "SAM" else "⚠️"

    body = f"""{emoji} *AROMI अलर्ट*

बच्चे का नाम: *{child_name}*
जोखिम स्तर: *{status.upper()}*

{message}

कृपया तुरंत आंगनवाड़ी कार्यकर्ता से संपर्क करें।
_यह संदेश AROMI AI सिस्टम द्वारा स्वचालित रूप से भेजा गया है।_"""

    try:
        msg = _get_client().messages.create(
            from_=settings.TWILIO_WHATSAPP_NUMBER,
            body=body,
            to=f"whatsapp:{to_number}",
        )
        return msg.sid
    except Exception as e:
        # Log but don't crash the main endpoint
        print(f"[AROMI Alerts] WhatsApp send failed to {to_number}: {e}")
        return f"error:{e}"


# ─────────────────────────────────────────────
# HINDI VOICE CALL
# ─────────────────────────────────────────────

def make_hindi_voice_call(
    to_number: str,
    child_name: str,
) -> str:
    
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">
    नमस्ते। यह AROMI स्वास्थ्य सेवा से एक महत्वपूर्ण सूचना है।
    {child_name} में गंभीर कुपोषण के लक्षण पाए गए हैं।
    कृपया तुरंत नजदीकी PHC जाएं।
    मैं दोहराती हूं —
    {child_name} में गंभीर कुपोषण के लक्षण पाए गए हैं।
    कृपया तुरंत PHC जाएं।
    धन्यवाद।
  </Say>
</Response>"""

    try:
        call = _get_client().calls.create(
            twiml=twiml,
            to=to_number,
            from_=settings.TWILIO_CALLER_NUMBER,
        )
        return call.sid
    except Exception as e:
        print(f"[AROMI Alerts] Voice call failed to {to_number}: {e}")
        return f"error:{e}"


# ─────────────────────────────────────────────
# FULL SAM ESCALATION (convenience wrapper)
# ─────────────────────────────────────────────

def trigger_sam_escalation(
    parent_number: str,
    supervisor_number: str,
    child_name: str,
) -> dict:
    """
    One-call full SAM alert workflow:
      1. WhatsApp → parent
      2. WhatsApp → supervisor
      3. Hindi voice call → parent

    Returns dict with SIDs / error info for logging.
    """
    results = {}

    # 1. Parent WhatsApp
    results["parent_whatsapp"] = send_whatsapp_alert(
        to_number=parent_number,
        child_name=child_name,
        status="SAM",
        message="तुरंत PHC रेफरल आवश्यक है। NRC में भर्ती की आवश्यकता हो सकती है।",
    )

    # 2. Supervisor WhatsApp
    results["supervisor_whatsapp"] = send_whatsapp_alert(
        to_number=supervisor_number,
        child_name=child_name,
        status="SAM",
        message="उच्च प्राथमिकता वाले बच्चे का पता चला है। कृपया तुरंत कार्यवाही सुनिश्चित करें।",
    )

    # 3. Hindi voice call to parent
    results["voice_call"] = make_hindi_voice_call(
        to_number=parent_number,
        child_name=child_name,
    )

    return results

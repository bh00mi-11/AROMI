"""
Whisper transcription service — lazy-loaded singleton.

The model is instantiated once on first use and reused for every subsequent
request, avoiding the overhead of loading weights on every /voice/process call.
"""

import logging
import os
import threading

log = logging.getLogger(__name__)

_model = None
_model_lock = threading.Lock()


def _get_model():
    """Return (or create) the singleton WhisperModel instance."""
    global _model
    if _model is not None:
        return _model

    with _model_lock:
        # Double-check after acquiring lock
        if _model is not None:
            return _model

        try:
            from faster_whisper import WhisperModel
        except ImportError:
            raise RuntimeError(
                "faster-whisper is not installed. "
                "Run: pip install faster-whisper"
            )

        model_name = os.getenv("WHISPER_MODEL", "small")
        log.info(f"Loading Whisper model ({model_name}, cpu, int8) — one-time init…")
        _model = WhisperModel(model_name, device="cpu", compute_type="int8")
        log.info("Whisper model loaded successfully.")
        return _model


VOCABULARY_PROMPT = "AROMI, active cases, pending cases, resolved cases, dashboard, reports, alerts, urgent, emergency, high priority, Pune, case ID, report ID, profile, notifications, Rahul Sharma, weight, height, MUAC, kilogram, centimeter, वजन, रिपोर्ट, अलर्ट, डैशबोर्ड, केस"


def transcribe_audio(file_path: str, language: str = None) -> str:
    """
    Transcribe an audio file to text using Faster-Whisper.

    Parameters
    ----------
    file_path : str
        Path to the audio file on disk.
    language : str
        Language code for transcription (default: None).

    Returns
    -------
    str
        Transcribed text, or empty string if no speech was detected.
    """
    model = _get_model()

    segments, info = model.transcribe(
        file_path,
        language=language,
        vad_filter=True,
        beam_size=5,
        initial_prompt=VOCABULARY_PROMPT
    )

    text = " ".join(seg.text for seg in segments).strip()
    return text

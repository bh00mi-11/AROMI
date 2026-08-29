"""
Whisper transcription service — lazy-loaded singleton.

The model is instantiated once on first use and reused for every subsequent
request, avoiding the overhead of loading weights on every /voice/process call.
"""

import io
import logging
import os
import threading
from typing import Union, BinaryIO, Optional

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


def transcribe_audio(
    audio_source: Union[str, BinaryIO, bytes, io.BytesIO],
    language: Optional[str] = None,
    beam_size: Optional[int] = None,
) -> str:
    """
    Transcribe audio from a file path or in-memory buffer to text using Faster-Whisper.

    Parameters
    ----------
    audio_source : Union[str, BinaryIO, bytes, io.BytesIO]
        Path to audio file on disk, or in-memory binary stream / raw bytes.
    language : Optional[str]
        Language code for transcription (default: None).
    beam_size : Optional[int]
        Beam size for decoding. Defaults to env WHISPER_BEAM_SIZE or 1 for fast CPU inference.

    Returns
    -------
    str
        Transcribed text, or empty string if no speech was detected.
    """
    model = _get_model()

    if isinstance(audio_source, (bytes, bytearray)):
        audio_input = io.BytesIO(audio_source)
    else:
        audio_input = audio_source

    if beam_size is None:
        try:
            beam_size = int(os.getenv("WHISPER_BEAM_SIZE", "1"))
        except (ValueError, TypeError):
            beam_size = 1

    segments, info = model.transcribe(
        audio_input,
        language=language,
        vad_filter=True,
        beam_size=beam_size,
        temperature=0.0,
        initial_prompt=VOCABULARY_PROMPT
    )

    text = " ".join(seg.text for seg in segments).strip()
    return text

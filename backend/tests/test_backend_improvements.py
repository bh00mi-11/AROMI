"""
Unit and Integration Tests for AROMI Backend Improvements:
1. Voice LLM Planner (async / await)
2. Faster-Whisper In-Memory Audio & Fast CPU Beam Size
3. Robust Background Task Queue (timeouts & retries)
4. Response Caching (TTLCache / cachetools)
5. WHO Standard LMS Curve Equations (Box-Cox Transform 0–60 Months)
"""

import asyncio
import io
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# ── 1. Voice LLM Planner Tests ───────────────────────────────────────────────
@pytest.mark.asyncio
async def test_voice_llm_planner_deterministic():
    from app.services.voice_llm_planner import plan_voice_action

    # Deterministic intent matches classifier without calling LLM
    result = await plan_voice_action("show active alerts", {})
    assert len(result) == 1
    assert result[0]["tool"] == "LEGACY_INTENT"
    assert "LIST_ACTIVE_ALERTS" in result[0]["intent"]


@pytest.mark.asyncio
async def test_voice_llm_planner_async_fallback():
    from app.services.voice_llm_planner import plan_voice_action

    mock_llm_response = json.dumps([
        {"tool": "SEARCH_RECORDS", "query": "Rahul"},
        {"tool": "OPEN_RECORD", "result_index": 1}
    ])

    with patch("app.services.voice_llm_planner.chat_completion", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = f"```json\n{mock_llm_response}\n```"

        plan = await plan_voice_action("find Rahul and open his profile", {})
        assert len(plan) == 2
        assert plan[0]["tool"] == "SEARCH_RECORDS"
        assert plan[1]["tool"] == "OPEN_RECORD"
        mock_chat.assert_awaited_once()


# ── 2. Faster-Whisper In-Memory Audio Tests ───────────────────────────────────
def test_whisper_in_memory_and_beam_size():
    from app.services.whisper_service import transcribe_audio

    mock_segment = MagicMock()
    mock_segment.text = "नमस्ते यह एक परीक्षण है"

    mock_model = MagicMock()
    mock_model.transcribe.return_value = ([mock_segment], MagicMock())

    with patch("app.services.whisper_service._get_model", return_value=mock_model):
        audio_buffer = io.BytesIO(b"fake_audio_bytes_data")
        result = transcribe_audio(audio_buffer, language="hi")

        assert result == "नमस्ते यह एक परीक्षण है"
        mock_model.transcribe.assert_called_once()
        args, kwargs = mock_model.transcribe.call_args

        # Verify input was passed as in-memory stream directly
        assert args[0] == audio_buffer
        # Verify beam_size default is 1 for fast CPU inference
        assert kwargs["beam_size"] == 1
        assert kwargs["vad_filter"] is True
        assert kwargs["temperature"] == 0.0


# ── 3. Background Task Queue Tests ───────────────────────────────────────────
@pytest.mark.asyncio
async def test_background_task_queue_success():
    from app.services.task_queue import BackgroundTaskQueue, TaskStatus

    queue = BackgroundTaskQueue(max_concurrent_workers=2)
    await queue.start()

    async def sample_async_job(x, y):
        await asyncio.sleep(0.01)
        return x + y

    task_id = queue.enqueue("add_job", sample_async_job, 10, 20, timeout_seconds=5.0)
    assert task_id is not None

    # Wait for completion
    for _ in range(50):
        info = queue.get_task(task_id)
        if info and info["status"] == TaskStatus.COMPLETED.value:
            break
        await asyncio.sleep(0.02)

    task_info = queue.get_task(task_id)
    assert task_info["status"] == TaskStatus.COMPLETED.value
    assert task_info["result"] == 30

    await queue.stop()


@pytest.mark.asyncio
async def test_background_task_queue_timeout_and_retry():
    from app.services.task_queue import BackgroundTaskQueue, TaskStatus

    queue = BackgroundTaskQueue(max_concurrent_workers=1)
    await queue.start()

    async def hanging_job():
        await asyncio.sleep(5.0)
        return "done"

    # Set 0.05s timeout with 1 retry
    task_id = queue.enqueue("hanging_job", hanging_job, timeout_seconds=0.05, max_retries=1)

    for _ in range(50):
        info = queue.get_task(task_id)
        if info and info["status"] in (TaskStatus.TIMEOUT.value, TaskStatus.FAILED.value):
            break
        await asyncio.sleep(0.02)

    task_info = queue.get_task(task_id)
    assert task_info["status"] in (TaskStatus.TIMEOUT.value, TaskStatus.FAILED.value)
    assert task_info["retries"] >= 1

    await queue.stop()


# ── 4. TTLCache Response Caching Tests ───────────────────────────────────────
def test_response_caching_and_invalidation():
    from app.services.cache import (
        get_cached_dashboard_stats, set_cached_dashboard_stats, invalidate_dashboard_stats,
        get_cached_activity_plan, set_cached_activity_plan, invalidate_activity_cache,
        get_cached_rag_query, set_cached_rag_query, invalidate_rag_cache,
        clear_all_caches
    )

    clear_all_caches()

    # Dashboard Cache
    worker_id = 99
    stats_data = {"total_children": 25, "sam_count": 2}
    set_cached_dashboard_stats(worker_id, stats_data)
    assert get_cached_dashboard_stats(worker_id) == stats_data

    invalidate_dashboard_stats(worker_id)
    assert get_cached_dashboard_stats(worker_id) is None

    # Activity Plan Cache
    plan_data = {"session_title": "Morning Counting", "activities": []}
    set_cached_activity_plan("3-6", 15, "hindi", plan_data)
    assert get_cached_activity_plan("3-6", 15, "hindi") == plan_data
    # Check normalized matching
    assert get_cached_activity_plan(" 3-6 ", 15, "HINDI") == plan_data

    invalidate_activity_cache()
    assert get_cached_activity_plan("3-6", 15, "hindi") is None

    # RAG Query Cache
    rag_data = {"answer": "MUAC standard is 11.5cm", "sources": ["WHO"]}
    set_cached_rag_query("what is SAM muac?", "english", rag_data)
    assert get_cached_rag_query("what is SAM muac?", "english") == rag_data
    # Normalized query check
    assert get_cached_rag_query("  WHAT  is   sam   muac? ", "ENGLISH") == rag_data

    invalidate_rag_cache()
    assert get_cached_rag_query("what is SAM muac?", "english") is None


# ── 5. WHO Standard LMS Curve Equations Tests ────────────────────────────────
def test_who_lms_curve_calculations():
    from app.services.growth import (
        calculate_waz_zscore,
        classify_nutrition_status,
        generate_shap_explanation_hindi,
        NutritionStatus,
        get_lms_parameters
    )

    # 1. Exact Median at Birth for Boy (0 months, M = 3.3464 kg) -> Z = 0.00
    z, l, m, s = calculate_waz_zscore(3.3464, 0, gender="M")
    assert round(z, 2) == 0.00
    assert round(m, 2) == 3.35

    # 2. Boy at 12 months with weight 7.5 kg (M = 9.6479) -> WAZ approx -2.27 (MAM)
    z_boy_12, _, _, _ = calculate_waz_zscore(7.5, 12, gender="M")
    assert -2.40 < z_boy_12 < -2.15

    # 3. Girl at 6 months with weight 4.8 kg (M = 7.297) -> WAZ approx -3.49 (SAM)
    z_girl_6, _, _, _ = calculate_waz_zscore(4.8, 6, gender="F")
    assert z_girl_6 < -3.0

    # 4. Classification Resolution with WHO LMS & MUAC
    # Case A: SAM via MUAC (< 11.5 cm)
    status_sam, shap_sam = classify_nutrition_status(
        weight_kg=8.5,
        height_cm=75.0,
        muac_cm=11.2,
        age_months=18,
        gender="M",
    )
    assert status_sam == NutritionStatus.SAM
    assert "MUAC 11.2 cm" in shap_sam["primary_indicator"]
    assert "waz" in shap_sam

    # Case B: SAM via WAZ (Weight critically low even if MUAC not measured)
    status_waz_sam, shap_waz_sam = classify_nutrition_status(
        weight_kg=4.8,
        height_cm=65.0,
        muac_cm=None,
        age_months=6,
        gender="F",
    )
    assert status_waz_sam == NutritionStatus.SAM
    assert shap_waz_sam["waz"] < -3.0

    # Case C: Normal Child
    status_norm, shap_norm = classify_nutrition_status(
        weight_kg=12.15,
        height_cm=86.0,
        muac_cm=14.0,
        age_months=24,
        gender="M",
    )
    assert status_norm == NutritionStatus.NORMAL
    assert -1.0 <= shap_norm["waz"] <= 1.0

    # Case D: Fractional age interpolation
    l_frac, m_frac, s_frac = get_lms_parameters(12.5, gender="M")
    assert 9.64 < m_frac < 9.88  # Between month 12 (9.6479) and month 13 (9.8749)

    # 5. Hindi SHAP Explanation contains WAZ and clinical referral
    hindi_exp = generate_shap_explanation_hindi(status_sam, shap_sam, "आरव")
    assert "आरव" in hindi_exp
    assert "गंभीर कुपोषण (SAM)" in hindi_exp
    assert "PHC रेफरल" in hindi_exp

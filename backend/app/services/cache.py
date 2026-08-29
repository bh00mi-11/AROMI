"""
AROMI In-Memory Response Caching Service using cachetools TTLCache.

Caches:
- Dashboard statistics (/dashboard/stats) per worker (TTL: 60s)
- ECCE daily activity plans (/activity/generate) per (age_group, child_count, language) (TTL: 24h)
- RAG document queries (/rag/query) per (normalized_question, language) (TTL: 30m)

Provides fine-grained cache invalidation hooks.
"""

import threading
from typing import Any, Dict, Optional, Tuple
from cachetools import TTLCache

_lock = threading.Lock()

# 1. Dashboard Stats Cache: 60s TTL, keyed by worker_id
_dashboard_cache: TTLCache = TTLCache(maxsize=256, ttl=60.0)

# 2. ECCE Activity Plan Cache: 24h (86400s) TTL, keyed by (age_group, child_count, language)
_activity_cache: TTLCache = TTLCache(maxsize=512, ttl=86400.0)

# 3. RAG Document Query Cache: 30m (1800s) TTL, keyed by (normalized_question, language)
_rag_cache: TTLCache = TTLCache(maxsize=1024, ttl=1800.0)


# ── Dashboard Stats Cache ────────────────────────────────────────────────────

def get_cached_dashboard_stats(worker_id: int) -> Optional[Dict[str, Any]]:
    with _lock:
        data = _dashboard_cache.get(worker_id)
        if data is not None:
            return dict(data)
        return None


def set_cached_dashboard_stats(worker_id: int, stats: Dict[str, Any]) -> None:
    with _lock:
        _dashboard_cache[worker_id] = stats


def invalidate_dashboard_stats(worker_id: Optional[int] = None) -> None:
    """Invalidate cache for a specific worker or all workers."""
    with _lock:
        if worker_id is not None:
            _dashboard_cache.pop(worker_id, None)
        else:
            _dashboard_cache.clear()


# ── ECCE Activity Plan Cache ─────────────────────────────────────────────────

def _normalize_activity_key(age_group: str, child_count: int, language: str) -> Tuple[str, int, str]:
    return (str(age_group).strip().lower(), int(child_count), str(language).strip().lower())


def get_cached_activity_plan(age_group: str, child_count: int, language: str) -> Optional[Dict[str, Any]]:
    key = _normalize_activity_key(age_group, child_count, language)
    with _lock:
        data = _activity_cache.get(key)
        if data is not None:
            return dict(data)
        return None


def set_cached_activity_plan(age_group: str, child_count: int, language: str, plan: Dict[str, Any]) -> None:
    key = _normalize_activity_key(age_group, child_count, language)
    with _lock:
        _activity_cache[key] = plan


def invalidate_activity_cache() -> None:
    with _lock:
        _activity_cache.clear()


# ── RAG Document Query Cache ─────────────────────────────────────────────────

def _normalize_rag_key(question: str, language: str) -> Tuple[str, str]:
    norm_q = " ".join(str(question).strip().lower().split())
    return (norm_q, str(language).strip().lower())


def get_cached_rag_query(question: str, language: str) -> Optional[Dict[str, Any]]:
    key = _normalize_rag_key(question, language)
    with _lock:
        data = _rag_cache.get(key)
        if data is not None:
            return dict(data)
        return None


def set_cached_rag_query(question: str, language: str, response: Dict[str, Any]) -> None:
    key = _normalize_rag_key(question, language)
    with _lock:
        _rag_cache[key] = response


def invalidate_rag_cache() -> None:
    with _lock:
        _rag_cache.clear()


def clear_all_caches() -> None:
    with _lock:
        _dashboard_cache.clear()
        _activity_cache.clear()
        _rag_cache.clear()

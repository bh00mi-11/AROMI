"""
AROMI Robust Background Task Queue Service.

Provides async job queueing, worker pool lifecycle management, per-task timeout
enforcement, retry logic with exponential backoff, and task execution tracking.
Ensures external network stalls (Twilio, OpenRouter, etc.) never block request lifecycles.
"""

import asyncio
import functools
import inspect
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger("aromi.task_queue")


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


@dataclass
class QueuedTask:
    task_id: str
    name: str
    func: Callable
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    timeout_seconds: float = 15.0
    max_retries: int = 2
    retry_count: int = 0
    status: TaskStatus = TaskStatus.PENDING
    result: Any = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None


class BackgroundTaskQueue:
    def __init__(self, max_concurrent_workers: int = 4, max_history: int = 500):
        self._queue: Optional[asyncio.Queue] = None
        self._workers: List[asyncio.Task] = []
        self._tasks: Dict[str, QueuedTask] = {}
        self._max_concurrent_workers = max_concurrent_workers
        self._max_history = max_history
        self._running = False
        self._lock = asyncio.Lock()

    def _ensure_queue(self):
        if self._queue is None:
            self._queue = asyncio.Queue()

    async def start(self):
        """Start background worker pool."""
        async with self._lock:
            if self._running:
                return
            self._ensure_queue()
            self._running = True
            self._workers = [
                asyncio.create_task(self._worker_loop(worker_id=i))
                for i in range(self._max_concurrent_workers)
            ]
            logger.info(f"BackgroundTaskQueue started with {self._max_concurrent_workers} workers.")

    async def stop(self):
        """Gracefully stop background worker pool."""
        async with self._lock:
            if not self._running:
                return
            self._running = False
            for _ in self._workers:
                if self._queue:
                    await self._queue.put(None)  # Sentinel to terminate worker
            await asyncio.gather(*self._workers, return_exceptions=True)
            self._workers.clear()
            logger.info("BackgroundTaskQueue stopped successfully.")

    async def _execute_task(self, task: QueuedTask):
        task.status = TaskStatus.RUNNING
        task.started_at = time.time()
        attempt = 0

        while attempt <= task.max_retries:
            try:
                if inspect.iscoroutinefunction(task.func):
                    coro = task.func(*task.args, **task.kwargs)
                else:
                    loop = asyncio.get_running_loop()
                    call = functools.partial(task.func, *task.args, **task.kwargs)
                    coro = loop.run_in_executor(None, call)

                result = await asyncio.wait_for(coro, timeout=task.timeout_seconds)
                task.status = TaskStatus.COMPLETED
                task.result = result
                task.finished_at = time.time()
                logger.info(f"[TaskQueue] Task {task.name} ({task.task_id}) completed in {task.finished_at - task.started_at:.2f}s")
                return result

            except asyncio.TimeoutError:
                task.error = f"Task timed out after {task.timeout_seconds}s (attempt {attempt + 1}/{task.max_retries + 1})"
                logger.warning(f"[TaskQueue] {task.error} on {task.name} ({task.task_id})")
                if attempt >= task.max_retries:
                    task.status = TaskStatus.TIMEOUT
                    task.finished_at = time.time()
                    return None

            except Exception as e:
                task.error = f"{type(e).__name__}: {str(e)} (attempt {attempt + 1}/{task.max_retries + 1})"
                logger.error(f"[TaskQueue] Task failed: {task.error} on {task.name} ({task.task_id})")
                if attempt >= task.max_retries:
                    task.status = TaskStatus.FAILED
                    task.finished_at = time.time()
                    return None

            attempt += 1
            task.retry_count = attempt
            backoff = 0.5 * (2 ** (attempt - 1))
            await asyncio.sleep(backoff)

    async def _worker_loop(self, worker_id: int):
        while self._running:
            try:
                self._ensure_queue()
                task = await self._queue.get()
                if task is None:  # Stop signal
                    self._queue.task_done()
                    break

                await self._execute_task(task)
                self._queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[TaskQueue] Worker-{worker_id} uncaught error: {e}")

    def enqueue(
        self,
        name: str,
        func: Callable,
        *args,
        timeout_seconds: float = 15.0,
        max_retries: int = 2,
        **kwargs,
    ) -> str:
        """
        Enqueue a background task without blocking the calling request lifecycle.
        Returns the unique task_id.
        """
        task_id = str(uuid.uuid4())
        task = QueuedTask(
            task_id=task_id,
            name=name,
            func=func,
            args=args,
            kwargs=kwargs,
            timeout_seconds=timeout_seconds,
            max_retries=max_retries,
        )

        # Evict oldest completed/failed tasks if history exceeds max
        if len(self._tasks) > self._max_history:
            oldest_keys = sorted(
                self._tasks.keys(),
                key=lambda k: self._tasks[k].created_at
            )[:50]
            for k in oldest_keys:
                self._tasks.pop(k, None)

        self._tasks[task_id] = task
        self._ensure_queue()

        try:
            self._queue.put_nowait(task)
        except Exception:
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(self._queue.put(task))
            except RuntimeError:
                pass

        logger.info(f"[TaskQueue] Enqueued background task: {name} (ID: {task_id})")
        return task_id

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve task execution details."""
        task = self._tasks.get(task_id)
        if not task:
            return None
        return {
            "task_id": task.task_id,
            "name": task.name,
            "status": task.status.value,
            "retries": task.retry_count,
            "result": task.result,
            "error": task.error,
            "created_at": task.created_at,
            "started_at": task.started_at,
            "finished_at": task.finished_at,
        }


# Global singleton instance
task_queue = BackgroundTaskQueue()


def enqueue_background_task(
    name: str,
    func: Callable,
    *args,
    timeout_seconds: float = 15.0,
    max_retries: int = 2,
    **kwargs,
) -> str:
    """Convenience function to enqueue a task into the global queue."""
    return task_queue.enqueue(
        name,
        func,
        *args,
        timeout_seconds=timeout_seconds,
        max_retries=max_retries,
        **kwargs,
    )

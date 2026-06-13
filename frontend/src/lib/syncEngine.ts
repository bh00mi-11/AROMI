/**
 * AROMI Sync Engine — Day 4
 * Background sync: drains offlineQueue when back online.
 * Exposes useSyncEngine() hook + SyncBadge component.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { db, enqueueOp, getPendingCount, QueuedOp } from "./offlineDB";
import api from "./api";

const SYNC_INTERVAL_MS = 30_000;   // 30 seconds
const MAX_RETRIES = 5;

// ─── Core sync function ───────────────────────────────────────────────────────

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  const pending = await db.offlineQueue
    .where("status")
    .anyOf(["pending"])
    .sortBy("timestamp");

  for (const op of pending) {
    try {
      await db.offlineQueue.update(op.id!, { status: "syncing" });

      if (op.method === "POST") {
        await api.post(op.endpoint, op.payload);
      } else if (op.method === "PUT") {
        await api.put(op.endpoint, op.payload);
      } else if (op.method === "PATCH") {
        await api.patch(op.endpoint, op.payload);
      } else if (op.method === "DELETE") {
        await api.delete(op.endpoint);
      }

      await db.offlineQueue.delete(op.id!);
      synced++;
    } catch (err) {
      const newRetries = (op.retries || 0) + 1;
      if (newRetries >= MAX_RETRIES) {
        await db.offlineQueue.update(op.id!, {
          status: "failed",
          retries: newRetries,
          errorMsg: String(err),
        });
        failed++;
      } else {
        await db.offlineQueue.update(op.id!, {
          status: "pending",
          retries: newRetries,
        });
      }
    }
  }

  return { synced, failed };
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useSyncEngine() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    const count = await getPendingCount();
    if (count === 0) return;

    setSyncing(true);
    try {
      await syncQueue();
      setLastSynced(new Date());
      await refreshCount();
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshCount]);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    intervalRef.current = setInterval(triggerSync, SYNC_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [triggerSync, refreshCount]);

  // Expose enqueue so components can push ops without importing db directly
  const enqueue = useCallback(
    async (endpoint: string, method: QueuedOp["method"], payload: any) => {
      const id = await enqueueOp(endpoint, method, payload);
      await refreshCount();
      // If online, try immediately
      if (navigator.onLine) triggerSync();
      return id;
    },
    [triggerSync, refreshCount]
  );

  return { pendingCount, isOnline, lastSynced, syncing, enqueue, triggerSync };
}

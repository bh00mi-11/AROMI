/**
 * AROMI Sync Engine — Day 4
 * Background sync: drains offlineQueue when back online.
 * Exposes useSyncEngine() hook + SyncBadge component support.
 */

import { useEffect, useState, useCallback } from "react";
import { db, enqueueOp, getPendingCount, QueuedOp } from "./offlineDB";
import api from "./api";

const SYNC_INTERVAL_MS = 30_000;   // 30 seconds
const MAX_RETRIES = 5;

export type SyncState = "idle" | "syncing" | "error" | "offline" | "synced";

export interface SyncStatus {
  state: SyncState;
  pendingCount: number;
  lastSynced: Date | null;
  error?: string | null;
}

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

// ─── Sync Engine Singleton ────────────────────────────────────────────────────

type SyncListener = (status: SyncStatus) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private status: SyncStatus = {
    state: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "synced",
    pendingCount: 0,
    lastSynced: null,
  };
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
      this.refreshCount().then(() => {
        this.syncTimer = setInterval(() => this.syncAll(), SYNC_INTERVAL_MS);
      });
    }
  }

  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const current = this.getStatus();
    this.listeners.forEach((l) => l(current));
  }

  private handleNetworkChange(online: boolean) {
    if (!online) {
      this.status.state = "offline";
      this.notify();
    } else {
      this.status.state = "synced";
      this.syncAll();
    }
  }

  public async refreshCount(): Promise<number> {
    try {
      const count = await getPendingCount();
      this.status.pendingCount = count;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        this.status.state = "offline";
      } else if (this.status.state !== "syncing") {
        this.status.state = "synced";
      }
      this.notify();
      return count;
    } catch {
      return 0;
    }
  }

  public async syncAll(): Promise<{ synced: number; failed: number }> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.status.state = "offline";
      this.notify();
      return { synced: 0, failed: 0 };
    }

    if (this.status.state === "syncing") {
      return { synced: 0, failed: 0 };
    }

    try {
      const count = await getPendingCount();
      if (count === 0) {
        this.status.pendingCount = 0;
        this.status.state = "synced";
        this.status.lastSynced = new Date();
        this.notify();
        return { synced: 0, failed: 0 };
      }

      this.status.state = "syncing";
      this.notify();

      const res = await syncQueue();
      this.status.lastSynced = new Date();
      const remaining = await getPendingCount();
      this.status.pendingCount = remaining;
      if (res.failed > 0 && remaining > 0) {
        this.status.state = "error";
      } else {
        this.status.state = "synced";
      }
      this.notify();
      return res;
    } catch (err: any) {
      this.status.state = "error";
      this.status.error = err?.message || String(err);
      this.notify();
      return { synced: 0, failed: 1 };
    }
  }

  public async enqueue(endpoint: string, method: QueuedOp["method"], payload: any) {
    const id = await enqueueOp(endpoint, method, payload);
    await this.refreshCount();
    if (typeof navigator !== "undefined" && navigator.onLine) {
      this.syncAll();
    }
    return id;
  }
}

export const syncEngine = new SyncEngine();

// ─── React hook ───────────────────────────────────────────────────────────────

export function useSyncEngine() {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus());

  useEffect(() => {
    return syncEngine.subscribe(setStatus);
  }, []);

  const triggerSync = useCallback(() => {
    return syncEngine.syncAll();
  }, []);

  const enqueue = useCallback(
    (endpoint: string, method: QueuedOp["method"], payload: any) => {
      return syncEngine.enqueue(endpoint, method, payload);
    },
    []
  );

  return {
    pendingCount: status.pendingCount,
    isOnline: status.state !== "offline",
    lastSynced: status.lastSynced,
    syncing: status.state === "syncing",
    enqueue,
    triggerSync,
  };
}

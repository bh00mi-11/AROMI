/**
 * SyncBadge — shows online/offline status + pending ops count
 * Appears in the Layout header.
 */
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useSyncEngine } from "../lib/syncEngine";

export default function SyncBadge() {
  const { pendingCount, isOnline, syncing, lastSynced, triggerSync } = useSyncEngine();

  return (
    <div className="flex items-center gap-1.5">
      {/* Online/offline dot + icon */}
      <button
        onClick={triggerSync}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all
          ${isOnline
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-600"
          }`}
        title={
          isOnline
            ? lastSynced
              ? `Last synced: ${lastSynced.toLocaleTimeString("hi-IN")}`
              : "Online"
            : "Offline — changes saved locally"
        }
      >
        {syncing ? (
          <RefreshCw size={11} className="animate-spin" />
        ) : isOnline ? (
          <Wifi size={11} />
        ) : (
          <WifiOff size={11} />
        )}
        {isOnline ? (syncing ? "सिंक…" : "ऑनलाइन") : "ऑफ़लाइन"}
      </button>

      {/* Pending count badge */}
      {pendingCount > 0 && (
        <span className="bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
    </div>
  );
}

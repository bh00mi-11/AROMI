import { useEffect, useState } from "react";
import { syncEngine, SyncStatus } from "../lib/syncEngine";
import { RefreshCw, CheckCircle, AlertTriangle, CloudOff } from "lucide-react";

export default function SyncBadge() {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus());

  useEffect(() => {
    return syncEngine.subscribe(setStatus);
  }, []);

  const triggerSync = () => {
    syncEngine.syncAll();
  };

  const getBadgeContent = () => {
    switch (status.state) {
      case "syncing":
        return (
          <button
            type="button"
            onClick={triggerSync}
            disabled
            aria-label="Synchronizing data in progress"
            className="flex items-center gap-1.5 bg-blue-50 text-gov-blue border border-blue-200 px-2.5 py-1 rounded-full text-xs font-semibold select-none cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gov-blue"
          >
            <RefreshCw size={12} className="animate-spin text-gov-blue shrink-0" />
            <span>सिंक हो रहा है...</span>
          </button>
        );
      case "error":
        return (
          <button
            type="button"
            onClick={triggerSync}
            aria-label="Sync error, click to retry synchronization"
            className="flex items-center gap-1.5 bg-red-50 text-danger-red border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-danger-red"
          >
            <AlertTriangle size={12} className="text-danger-red shrink-0" />
            <span>पुनः प्रयास ({status.pendingCount})</span>
          </button>
        );
      case "offline":
        return (
          <span
            role="status"
            aria-label="System is offline"
            className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold select-none"
          >
            <CloudOff size={12} className="text-amber-700 shrink-0" />
            <span>ऑफ़लाइन {status.pendingCount > 0 && `(${status.pendingCount})`}</span>
          </span>
        );
      case "synced":
      default:
        if (status.pendingCount > 0) {
          return (
            <button
              type="button"
              onClick={triggerSync}
              aria-label={`Pending sync: ${status.pendingCount} items. Click to synchronize.`}
              className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-warning-amber"
            >
              <RefreshCw size={12} className="text-amber-700 shrink-0" />
              <span>सिंक बाकी ({status.pendingCount})</span>
            </button>
          );
        }
        return (
          <button
            type="button"
            onClick={triggerSync}
            aria-label="All records synced. Click to refresh sync."
            title="क्लिक करके मैन्युअल सिंक करें"
            className="flex items-center gap-1.5 bg-green-50 text-success-green border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-green-100 transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-success-green"
          >
            <CheckCircle size={12} className="text-success-green shrink-0" />
            <span>सिंक पूर्ण</span>
          </button>
        );
    }
  };

  return <div className="inline-flex items-center">{getBadgeContent()}</div>;
}

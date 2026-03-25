"use client";

import { useStore } from "@/store";
import PatchCard from "./PatchCard";

export default function PatchOverlay() {
  const { pendingEdits, clearPendingEdits, acceptAndApplyAllEdits, addActivityEvent } = useStore();

  const pending = pendingEdits.filter((e) => e.status === "pending");
  if (pending.length === 0 && pendingEdits.length === 0) return null;

  const acceptAll = () => {
    acceptAndApplyAllEdits();
    addActivityEvent({ type: "edit_accepted", summary: `Accepted all ${pending.length} edits` });
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 max-h-[60%] overflow-y-auto space-y-2 pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {pendingEdits.map((edit) => (
          <PatchCard key={edit.id} edit={edit} />
        ))}
        {pending.length > 1 && (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={acceptAll}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
            >
              Accept All ({pending.length})
            </button>
            <button
              onClick={clearPendingEdits}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

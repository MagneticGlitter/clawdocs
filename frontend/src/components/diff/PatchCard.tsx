"use client";

import { useStore } from "@/store";
import type { PatchEdit } from "@/types";
import { Check, X, FileEdit, Pencil } from "lucide-react";

function DiffLine({ text, type }: { text: string; type: "add" | "remove" | "context" }) {
  const colors = {
    add: "bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500",
    remove: "bg-rose-500/10 text-rose-300 border-l-2 border-rose-500 line-through opacity-60",
    context: "text-slate-500",
  };
  const prefix = { add: "+", remove: "-", context: " " };
  return (
    <div className={`px-3 py-0.5 font-mono text-xs ${colors[type]}`}>
      <span className="inline-block w-4 text-slate-600 select-none">{prefix[type]}</span>
      {text}
    </div>
  );
}

const MAX_DIFF_LINES = 20;

function DiffView({ edit }: { edit: PatchEdit }) {
  const oldLines = edit.oldText?.split("\n") ?? [];
  const newLines = edit.newText?.split("\n") ?? [];

  const truncateOld = oldLines.length > MAX_DIFF_LINES;
  const truncateNew = newLines.length > MAX_DIFF_LINES;

  const shownOld = truncateOld ? oldLines.slice(0, 8) : oldLines;
  const shownNew = truncateNew ? newLines.slice(0, 8) : newLines;

  return (
    <div className="bg-slate-900/50 py-1 overflow-x-auto max-h-64 overflow-y-auto">
      {shownOld.map((line, i) => (
        <DiffLine key={`r${i}`} text={line} type="remove" />
      ))}
      {truncateOld && (
        <div className="px-3 py-0.5 text-xs text-slate-600 italic">
          ... {oldLines.length - 8} more lines removed
        </div>
      )}
      {shownNew.map((line, i) => (
        <DiffLine key={`a${i}`} text={line} type="add" />
      ))}
      {truncateNew && (
        <div className="px-3 py-0.5 text-xs text-slate-600 italic">
          ... {newLines.length - 8} more lines added
        </div>
      )}
    </div>
  );
}

export default function PatchCard({ edit }: { edit: PatchEdit }) {
  const { acceptAndApplyEdit, resolvePendingEdit, addActivityEvent } = useStore();

  const handleAccept = () => {
    acceptAndApplyEdit(edit.id);
    addActivityEvent({ type: "edit_accepted", summary: `Accepted: ${edit.description}` });
  };

  const handleReject = () => {
    resolvePendingEdit(edit.id, "rejected");
    addActivityEvent({ type: "edit_rejected", summary: `Rejected: ${edit.description}` });
  };

  if (edit.status !== "pending") {
    return (
      <div className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
        edit.status === "accepted"
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
          : "border-rose-500/20 bg-rose-500/5 text-rose-400"
      }`}>
        {edit.status === "accepted" ? <Check size={12} /> : <X size={12} />}
        {edit.description} — {edit.status}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-indigo-500/10 bg-indigo-500/5">
        <FileEdit size={13} className="text-indigo-400" />
        <span className="text-xs font-medium text-indigo-300 flex-1">{edit.description}</span>
        <span className="text-[10px] text-slate-500 uppercase font-semibold">{edit.type}</span>
      </div>

      {edit.reason && (
        <div className="px-3 py-1.5 text-[11px] text-slate-400 border-b border-slate-800/50">
          {edit.reason}
        </div>
      )}

      <DiffView edit={edit} />

      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-800/50">
        <button
          onClick={handleAccept}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
        >
          <Check size={12} />
          Accept
        </button>
        <button
          onClick={handleReject}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-600/20 transition-colors"
        >
          <X size={12} />
          Reject
        </button>
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 text-xs font-medium hover:bg-slate-800 transition-colors ml-auto"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>
    </div>
  );
}

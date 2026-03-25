"use client";

import { useStore } from "@/store";
import type { PatchEdit } from "@/types";
import { Check, X, FileEdit, Pencil } from "lucide-react";

function DiffLine({ text, type }: { text: string; type: "add" | "remove" | "context" }) {
  const colors = {
    add: "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500",
    remove: "bg-rose-50 text-rose-600 border-l-2 border-rose-400 line-through opacity-60",
    context: "text-gray-400",
  };
  const prefix = { add: "+", remove: "-", context: " " };
  return (
    <div className={`px-3 py-0.5 font-mono text-xs ${colors[type]}`}>
      <span className="inline-block w-4 text-gray-400 select-none">{prefix[type]}</span>
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
    <div className="bg-gray-50 py-1 overflow-x-auto max-h-64 overflow-y-auto">
      {shownOld.map((line, i) => (
        <DiffLine key={`r${i}`} text={line} type="remove" />
      ))}
      {truncateOld && (
        <div className="px-3 py-0.5 text-xs text-gray-400 italic">
          ... {oldLines.length - 8} more lines removed
        </div>
      )}
      {shownNew.map((line, i) => (
        <DiffLine key={`a${i}`} text={line} type="add" />
      ))}
      {truncateNew && (
        <div className="px-3 py-0.5 text-xs text-gray-400 italic">
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
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-rose-200 bg-rose-50 text-rose-600"
      }`}>
        {edit.status === "accepted" ? <Check size={12} /> : <X size={12} />}
        {edit.description} — {edit.status}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-indigo-100 bg-indigo-50">
        <FileEdit size={13} className="text-indigo-500" />
        <span className="text-xs font-medium text-indigo-700 flex-1">{edit.description}</span>
        <span className="text-[10px] text-gray-400 uppercase font-semibold">{edit.type}</span>
      </div>

      {edit.reason && (
        <div className="px-3 py-1.5 text-[11px] text-gray-500 border-b border-gray-100">
          {edit.reason}
        </div>
      )}

      <DiffView edit={edit} />

      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
        <button
          onClick={handleAccept}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors"
        >
          <Check size={12} />
          Accept
        </button>
        <button
          onClick={handleReject}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium hover:bg-rose-100 transition-colors"
        >
          <X size={12} />
          Reject
        </button>
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors ml-auto"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>
    </div>
  );
}

"use client";

import { useStore } from "@/store";
import type { ViewMode } from "@/types";
import {
  MessageSquare,
  Columns2,
  Eye,
  Pencil,
  Sparkles,
  Database as DatabaseIcon,
  Save,
} from "lucide-react";

const modeOptions: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: "edit", label: "Edit", icon: <Pencil size={14} /> },
  { mode: "split", label: "Split", icon: <Columns2 size={14} /> },
  { mode: "preview", label: "Preview", icon: <Eye size={14} /> },
];

export default function Toolbar() {
  const {
    viewMode,
    setViewMode,
    chatOpen,
    toggleChat,
    activeDocumentId,
    documents,
    updateDocumentTitle,
  } = useStore();

  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  return (
    <div className="h-12 bg-[#0d1117] border-b border-slate-800 flex items-center px-4 gap-3 shrink-0">
      {/* Doc title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          value={activeDoc?.title ?? ""}
          onChange={(e) => {
            if (activeDocumentId) updateDocumentTitle(activeDocumentId, e.target.value);
          }}
          className="bg-transparent text-white text-sm font-medium border-none outline-none min-w-0 flex-1 max-w-xs placeholder-slate-500 focus:ring-1 focus:ring-indigo-500/50 rounded px-1 -ml-1"
          placeholder="Untitled"
        />
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Save size={11} />
          <span>Saved</span>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5 gap-0.5">
        {modeOptions.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === mode
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors">
          <Sparkles size={13} />
          Ask AI
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
          <DatabaseIcon size={13} />
          Data Task
        </button>
        <button
          onClick={toggleChat}
          className={`p-2 rounded-lg transition-colors ${
            chatOpen
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
          title="Toggle chat"
        >
          <MessageSquare size={16} />
        </button>
      </div>
    </div>
  );
}

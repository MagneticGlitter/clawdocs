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
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
      {/* Doc title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          value={activeDoc?.title ?? ""}
          onChange={(e) => {
            if (activeDocumentId) updateDocumentTitle(activeDocumentId, e.target.value);
          }}
          className="bg-transparent text-gray-900 text-sm font-medium border-none outline-none min-w-0 flex-1 max-w-xs placeholder-gray-400 focus:ring-1 focus:ring-indigo-500/50 rounded px-1 -ml-1"
          placeholder="Untitled"
        />
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Save size={11} />
          <span>Saved</span>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
        {modeOptions.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === mode
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-colors">
          <Sparkles size={13} />
          Ask AI
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <DatabaseIcon size={13} />
          Data Task
        </button>
        <button
          onClick={toggleChat}
          className={`p-2 rounded-lg transition-colors ${
            chatOpen
              ? "bg-indigo-50 text-indigo-600"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          }`}
          title="Toggle chat"
        >
          <MessageSquare size={16} />
        </button>
      </div>
    </div>
  );
}

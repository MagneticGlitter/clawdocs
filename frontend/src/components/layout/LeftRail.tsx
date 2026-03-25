"use client";

import { useStore } from "@/store";
import {
  FileText,
  Plus,
  Database,
  Settings,
  ChevronLeft,
  Trash2,
} from "lucide-react";

export default function LeftRail() {
  const {
    documents,
    activeDocumentId,
    leftRailOpen,
    toggleLeftRail,
    createDocument,
    setActiveDocument,
    deleteDocument,
  } = useStore();

  if (!leftRailOpen) {
    return (
      <div className="w-12 bg-[#0a0e14] border-r border-slate-800 flex flex-col items-center py-4 gap-3">
        <button
          onClick={toggleLeftRail}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Expand sidebar"
        >
          <FileText size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 bg-[#0a0e14] border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">ClawDocs</span>
        </div>
        <button
          onClick={toggleLeftRail}
          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* New doc */}
      <div className="p-3">
        <button
          onClick={() => createDocument()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors text-sm font-medium"
        >
          <Plus size={15} />
          New Document
        </button>
      </div>

      {/* Documents list */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Documents
        </div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors mb-0.5 ${
              doc.id === activeDocumentId
                ? "bg-slate-800/80 text-white"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
            }`}
            onClick={() => setActiveDocument(doc.id)}
          >
            <FileText size={14} className="shrink-0" />
            <span className="truncate flex-1">{doc.title}</span>
            {documents.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDocument(doc.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 transition-colors text-sm">
          <Database size={14} />
          <span>MCP Connections</span>
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 transition-colors text-sm">
          <Settings size={14} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

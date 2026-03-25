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
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-3">
        <button
          onClick={toggleLeftRail}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Expand sidebar"
        >
          <FileText size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img src="/clawdocs.png" alt="ClawDocs" className="w-7 h-7 rounded-lg object-contain" />
          <span className="text-sm font-semibold text-gray-900 tracking-tight">ClawDocs</span>
        </div>
        <button
          onClick={toggleLeftRail}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* New doc */}
      <div className="p-3">
        <button
          onClick={() => createDocument()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-colors text-sm font-medium"
        >
          <Plus size={15} />
          New Document
        </button>
      </div>

      {/* Documents list */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Documents
        </div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors mb-0.5 ${
              doc.id === activeDocumentId
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-rose-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm">
          <Database size={14} />
          <span>MCP Connections</span>
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm">
          <Settings size={14} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

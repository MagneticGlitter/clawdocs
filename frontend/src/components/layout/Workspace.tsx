"use client";

import { useStore } from "@/store";
import dynamic from "next/dynamic";
import MarkdownPreview from "@/components/preview/MarkdownPreview";
import PatchOverlay from "@/components/diff/PatchOverlay";

const MarkdownEditor = dynamic(
  () => import("@/components/editor/MarkdownEditor"),
  { ssr: false }
);

export default function Workspace() {
  const { viewMode, activeDocumentId, documents, updateDocumentContent } = useStore();
  const doc = documents.find((d) => d.id === activeDocumentId);

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117] text-slate-500">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-400">No document open</p>
          <p className="text-sm mt-1">Create a new document from the sidebar</p>
        </div>
      </div>
    );
  }

  const showEditor = viewMode === "edit" || viewMode === "split";
  const showPreview = viewMode === "preview" || viewMode === "split";

  return (
    <div className="flex-1 flex relative overflow-hidden">
      {showEditor && (
        <div className={`${viewMode === "split" ? "w-[55%]" : "w-full"} relative flex flex-col border-r border-slate-800`}>
          <MarkdownEditor
            value={doc.content}
            onChange={(val) => updateDocumentContent(doc.id, val)}
          />
          <PatchOverlay />
        </div>
      )}
      {showPreview && (
        <div className={`${viewMode === "split" ? "w-[45%]" : "w-full"} overflow-hidden`}>
          <MarkdownPreview content={doc.content} />
        </div>
      )}
    </div>
  );
}

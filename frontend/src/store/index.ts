import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type {
  Document,
  ChatMessage,
  PatchEdit,
  ActivityEvent,
  ViewMode,
} from "@/types";

function applyEditToContent(content: string, edit: PatchEdit): string {
  // Full document replacement — just swap entirely
  if (edit.type === "replace_all" && edit.newText != null) {
    return edit.newText;
  }

  if (edit.type === "replace") {
    if (edit.oldText && edit.newText != null) {
      // Exact match
      if (content.includes(edit.oldText)) {
        return content.replace(edit.oldText, edit.newText);
      }
      // Normalize newlines and try again
      const normalizedContent = content.replace(/\r\n/g, "\n");
      const normalizedOld = edit.oldText.replace(/\r\n/g, "\n");
      if (normalizedContent.includes(normalizedOld)) {
        return normalizedContent.replace(normalizedOld, edit.newText);
      }
      // Trim whitespace and try again
      const trimmedOld = normalizedOld.trim();
      const idx = normalizedContent.indexOf(trimmedOld);
      if (idx !== -1) {
        return normalizedContent.slice(0, idx) + edit.newText + normalizedContent.slice(idx + trimmedOld.length);
      }
      // Fuzzy: try matching just the first non-empty line of oldText
      const firstLine = trimmedOld.split("\n").find((l) => l.trim().length > 0)?.trim();
      if (firstLine && firstLine.length > 10) {
        const lineIdx = normalizedContent.indexOf(firstLine);
        if (lineIdx !== -1) {
          // Find the extent: from the first line to the last line of oldText
          const lastLine = trimmedOld.split("\n").filter((l) => l.trim().length > 0).pop()?.trim();
          if (lastLine) {
            const lastIdx = normalizedContent.indexOf(lastLine, lineIdx);
            if (lastIdx !== -1) {
              const endIdx = lastIdx + lastLine.length;
              return normalizedContent.slice(0, lineIdx) + edit.newText + normalizedContent.slice(endIdx);
            }
          }
          return normalizedContent.slice(0, lineIdx) + edit.newText + normalizedContent.slice(lineIdx + firstLine.length);
        }
      }
    }
    if (edit.startLine != null && edit.endLine != null && edit.newText != null) {
      const lines = content.split("\n");
      lines.splice(edit.startLine, edit.endLine - edit.startLine, ...edit.newText.split("\n"));
      return lines.join("\n");
    }
  }

  if (edit.type === "insert" && edit.newText != null) {
    if (edit.anchor) {
      const idx = content.indexOf(edit.anchor);
      if (idx !== -1) {
        const afterAnchor = idx + edit.anchor.length;
        const nextNewline = content.indexOf("\n", afterAnchor);
        const insertAt = nextNewline !== -1 ? nextNewline + 1 : content.length;
        return content.slice(0, insertAt) + "\n" + edit.newText + "\n" + content.slice(insertAt);
      }
    }
    if (edit.startLine != null) {
      const lines = content.split("\n");
      lines.splice(edit.startLine + 1, 0, ...edit.newText.split("\n"));
      return lines.join("\n");
    }
    return content + "\n\n" + edit.newText;
  }

  if (edit.type === "delete") {
    if (edit.oldText) {
      return content.replace(edit.oldText, "");
    }
    if (edit.startLine != null && edit.endLine != null) {
      const lines = content.split("\n");
      lines.splice(edit.startLine, edit.endLine - edit.startLine);
      return lines.join("\n");
    }
  }

  return content;
}

const SAMPLE_MARKDOWN = `# Weekly Retention Report

## Overview

This report covers weekly user retention metrics across all regions.

## Key Findings

Retention rates have remained stable at approximately **42%** week-over-week, with notable exceptions in the Canadian market where a **6 percentage point drop** was observed starting Week 12.

### Regional Breakdown

| Region | W10 | W11 | W12 | W13 |
|--------|-----|-----|-----|-----|
| US | 44% | 43% | 44% | 43% |
| Canada | 41% | 40% | 34% | 33% |
| UK | 39% | 40% | 41% | 40% |
| Germany | 38% | 38% | 39% | 38% |

## Retention Trend

\`\`\`clawchart
type: line
source: retention_by_week
x: week
y: retention_rate
title: Weekly retention across regions
\`\`\`

## Detailed Breakdown

\`\`\`clawtable
source: retention_breakdown
columns: [region, platform, users, retention_rate, trend]
\`\`\`

## Analysis

The Canadian retention drop correlates with the v3.2 app update rollout on March 1st. Android users were disproportionately affected, suggesting a platform-specific regression.

### Recommendations

1. **Investigate** the v3.2 Android release for Canada-specific issues
2. **Monitor** the next two weekly cohorts for recovery signals
3. **Consider** a targeted re-engagement campaign for churned Canadian users

## Next Steps

- [ ] Engineering to review Android crash logs for Canadian users
- [ ] Product to schedule post-mortem for v3.2 rollout
- [ ] Data team to set up automated retention alerts by region
`;

interface DocumentState {
  documents: Document[];
  activeDocumentId: string | null;
  viewMode: ViewMode;
  chatOpen: boolean;
  leftRailOpen: boolean;
  chatMessages: ChatMessage[];
  activityEvents: ActivityEvent[];
  pendingEdits: PatchEdit[];
  isAgentRunning: boolean;

  // Actions
  createDocument: (title?: string) => string;
  setActiveDocument: (id: string) => void;
  updateDocumentContent: (id: string, content: string) => void;
  updateDocumentTitle: (id: string, title: string) => void;
  deleteDocument: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleChat: () => void;
  toggleLeftRail: () => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "createdAt">) => void;
  addActivityEvent: (evt: Omit<ActivityEvent, "id" | "timestamp">) => void;
  addPendingEdit: (edit: Omit<PatchEdit, "id">) => void;
  resolvePendingEdit: (id: string, status: "accepted" | "rejected") => void;
  acceptAndApplyEdit: (id: string) => void;
  acceptAndApplyAllEdits: () => void;
  clearPendingEdits: () => void;
  setAgentRunning: (running: boolean) => void;
  getActiveDocument: () => Document | undefined;
}

export const useStore = create<DocumentState>((set, get) => {
  const sampleId = uuid();
  return {
    documents: [
      {
        id: sampleId,
        title: "Weekly Retention Report",
        content: SAMPLE_MARKDOWN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    activeDocumentId: sampleId,
    viewMode: "split",
    chatOpen: true,
    leftRailOpen: true,
    chatMessages: [],
    activityEvents: [],
    pendingEdits: [],
    isAgentRunning: false,

    createDocument: (title?: string) => {
      const id = uuid();
      set((s) => ({
        documents: [
          ...s.documents,
          {
            id,
            title: title || "Untitled Document",
            content: "# New Document\n\nStart writing here...\n",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        activeDocumentId: id,
        chatMessages: [],
        activityEvents: [],
        pendingEdits: [],
      }));
      return id;
    },

    setActiveDocument: (id) =>
      set({
        activeDocumentId: id,
        chatMessages: [],
        activityEvents: [],
        pendingEdits: [],
      }),

    updateDocumentContent: (id, content) =>
      set((s) => ({
        documents: s.documents.map((d) =>
          d.id === id
            ? { ...d, content, updatedAt: new Date().toISOString() }
            : d
        ),
      })),

    updateDocumentTitle: (id, title) =>
      set((s) => ({
        documents: s.documents.map((d) =>
          d.id === id
            ? { ...d, title, updatedAt: new Date().toISOString() }
            : d
        ),
      })),

    deleteDocument: (id) =>
      set((s) => {
        const remaining = s.documents.filter((d) => d.id !== id);
        return {
          documents: remaining,
          activeDocumentId:
            s.activeDocumentId === id
              ? remaining[0]?.id ?? null
              : s.activeDocumentId,
        };
      }),

    setViewMode: (mode) => set({ viewMode: mode }),
    toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
    toggleLeftRail: () => set((s) => ({ leftRailOpen: !s.leftRailOpen })),

    addChatMessage: (msg) =>
      set((s) => ({
        chatMessages: [
          ...s.chatMessages,
          { ...msg, id: uuid(), createdAt: new Date().toISOString() },
        ],
      })),

    addActivityEvent: (evt) =>
      set((s) => ({
        activityEvents: [
          ...s.activityEvents,
          { ...evt, id: uuid(), timestamp: new Date().toISOString() },
        ],
      })),

    addPendingEdit: (edit) =>
      set((s) => ({
        pendingEdits: [...s.pendingEdits, { ...edit, id: uuid() }],
      })),

    resolvePendingEdit: (id, status) =>
      set((s) => ({
        pendingEdits: s.pendingEdits.map((e) =>
          e.id === id ? { ...e, status } : e
        ),
      })),

    acceptAndApplyEdit: (id) => {
      const s = get();
      const edit = s.pendingEdits.find((e) => e.id === id);
      const doc = s.documents.find((d) => d.id === s.activeDocumentId);
      if (!edit || !doc) return;

      const newContent = applyEditToContent(doc.content, edit);
      set((state) => ({
        pendingEdits: state.pendingEdits.map((e) =>
          e.id === id ? { ...e, status: "accepted" as const } : e
        ),
        documents: state.documents.map((d) =>
          d.id === doc.id
            ? { ...d, content: newContent, updatedAt: new Date().toISOString() }
            : d
        ),
      }));
    },

    acceptAndApplyAllEdits: () => {
      const s = get();
      const doc = s.documents.find((d) => d.id === s.activeDocumentId);
      if (!doc) return;

      const pending = s.pendingEdits.filter((e) => e.status === "pending");
      let content = doc.content;
      for (const edit of pending) {
        content = applyEditToContent(content, edit);
      }

      set((state) => ({
        pendingEdits: state.pendingEdits.map((e) =>
          e.status === "pending" ? { ...e, status: "accepted" as const } : e
        ),
        documents: state.documents.map((d) =>
          d.id === doc.id
            ? { ...d, content, updatedAt: new Date().toISOString() }
            : d
        ),
      }));
    },

    clearPendingEdits: () => set({ pendingEdits: [] }),

    setAgentRunning: (running) => set({ isAgentRunning: running }),

    getActiveDocument: () => {
      const s = get();
      return s.documents.find((d) => d.id === s.activeDocumentId);
    },
  };
});

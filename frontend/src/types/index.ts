export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  documentId: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ToolCall[];
  pendingEdits?: PatchEdit[];
  createdAt: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | string;
  status: "running" | "completed" | "failed";
}

export interface PatchEdit {
  id: string;
   type: "replace" | "replace_all" | "insert" | "delete";
  description: string;
  reason?: string;
  /** For replace/delete: 0-indexed start line */
  startLine?: number;
  /** For replace/delete: 0-indexed end line (exclusive) */
  endLine?: number;
  /** For insert: insert after this heading or line */
  anchor?: string;
  oldText?: string;
  newText?: string;
  status: "pending" | "accepted" | "rejected";
}

export interface ActivityEvent {
  id: string;
  type: "plan" | "tool_call" | "edit_proposed" | "edit_accepted" | "edit_rejected" | "completed" | "error";
  summary: string;
  detail?: string;
  timestamp: string;
}

export type ViewMode = "edit" | "preview" | "split";

export interface ClawChartBlock {
  type: "line" | "bar" | "area" | "pie";
  source: string;
  x: string;
  y: string;
  title?: string;
  data?: Record<string, unknown>[];
}

export interface ClawTableBlock {
  source: string;
  columns: string[];
  data?: Record<string, unknown>[];
}

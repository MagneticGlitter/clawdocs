"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/store";
import {
  Send,
  Bot,
  User,
  Activity,
  MessageSquare,
  Loader2,
  Database,
  FileEdit,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Wrench,
} from "lucide-react";
import type { ChatMessage, ToolCall, PatchEdit } from "@/types";

type TabId = "chat" | "activity";

interface StreamEvent {
  type: "plan" | "tool_call" | "tool_result" | "reflection" | "edits" | "message" | "done" | "error";
  data: Record<string, unknown>;
}

interface ChatStreamError {
  message: string;
  code?: string;
}

function formatChatError(error: ChatStreamError): string {
  if (error.code === "SUPABASE_UNAVAILABLE") {
    return "Supabase is down right now. Please contact admin.";
  }

  return error.message.startsWith("Error:") ? error.message : `Error: ${error.message}`;
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-indigo-600" : "bg-gray-100"}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-indigo-500" />}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-gray-50 text-gray-700 rounded-tl-sm border border-gray-200"
        }`}>
          {message.content}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc) => (
              <div key={tc.id} className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
                <Wrench size={11} className="text-indigo-500" />
                <span className="font-medium text-gray-700">{tc.toolName}</span>
                <span className={`ml-auto ${tc.status === "completed" ? "text-emerald-600" : tc.status === "failed" ? "text-rose-500" : "text-amber-500"}`}>
                  {tc.status}
                </span>
              </div>
            ))}
          </div>
        )}
        {message.pendingEdits && message.pendingEdits.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.pendingEdits.map((edit) => (
              <div key={edit.id} className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                <FileEdit size={11} className="text-amber-500" />
                <span className="text-amber-700 flex-1">{edit.description}</span>
                <span className={`text-xs font-medium ${
                  edit.status === "accepted" ? "text-emerald-600" : edit.status === "rejected" ? "text-rose-500" : "text-amber-500"
                }`}>
                  {edit.status}
                </span>
              </div>
            ))}
          </div>
        )}
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

function ActivityTab() {
  const { activityEvents } = useStore();

  if (activityEvents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm px-6 text-center">
        <Activity size={24} className="mb-3 text-gray-300" />
        <p>No activity yet</p>
        <p className="text-xs mt-1 text-gray-400">Agent actions will appear here</p>
      </div>
    );
  }

  const eventIcon = (type: string) => {
    switch (type) {
      case "plan": return <ChevronRight size={12} className="text-indigo-500" />;
      case "tool_call": return <Database size={12} className="text-amber-500" />;
      case "edit_proposed": return <FileEdit size={12} className="text-blue-500" />;
      case "edit_accepted": return <CheckCircle2 size={12} className="text-emerald-500" />;
      case "edit_rejected": return <XCircle size={12} className="text-rose-500" />;
      case "completed": return <CheckCircle2 size={12} className="text-emerald-500" />;
      default: return <Activity size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-1">
      {activityEvents.map((evt) => (
        <div key={evt.id} className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="mt-0.5">{eventIcon(evt.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700">{evt.summary}</p>
            {evt.detail && <p className="text-[11px] text-gray-400 mt-0.5">{evt.detail}</p>}
            <span className="text-[10px] text-gray-400">
              {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

async function processSSEStream(
  response: Response,
  callbacks: {
    onPlan: (steps: string[]) => void;
    onToolCall: (tc: { toolName: string; input: Record<string, unknown>; status: string }) => void;
    onToolResult: (tr: { toolName: string; output: string; status: string }) => void;
    onMessage: (content: string) => void;
    onEdits: (edits: PatchEdit[]) => void;
    onError: (error: ChatStreamError) => void;
    onDone: () => void;
  }
) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const event: StreamEvent = JSON.parse(trimmed.slice(6));

        switch (event.type) {
          case "plan":
            callbacks.onPlan(event.data.steps as string[]);
            break;
          case "tool_call":
            callbacks.onToolCall(event.data as { toolName: string; input: Record<string, unknown>; status: string });
            break;
          case "tool_result":
            callbacks.onToolResult(event.data as { toolName: string; output: string; status: string });
            break;
          case "message":
            callbacks.onMessage(event.data.content as string);
            break;
          case "edits":
            callbacks.onEdits(
              (event.data.edits as Record<string, unknown>[]).map((e) => ({
                id: crypto.randomUUID(),
                type: (e.type as PatchEdit["type"]) ?? "insert",
                description: (e.description as string) ?? "Edit",
                reason: e.reason as string,
                startLine: e.startLine as number | undefined,
                endLine: e.endLine as number | undefined,
                anchor: e.anchor as string | undefined,
                oldText: e.oldText as string | undefined,
                newText: e.newText as string | undefined,
                status: "pending" as const,
              }))
            );
            break;
          case "error":
            callbacks.onError({
              message: event.data.message as string,
              code: event.data.code as string | undefined,
            });
            break;
          case "done":
            callbacks.onDone();
            break;
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

export default function ChatPanel() {
  const [tab, setTab] = useState<TabId>("chat");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    chatMessages,
    addChatMessage,
    isAgentRunning,
    chatOpen,
    addActivityEvent,
    addPendingEdit,
    setAgentRunning,
    getActiveDocument,
  } = useStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isAgentRunning) return;

    addChatMessage({ documentId: "", role: "user", content: text });
    setInput("");
    setAgentRunning(true);

    addActivityEvent({
      type: "plan",
      summary: "Processing user request",
      detail: text.slice(0, 80),
    });

    const doc = getActiveDocument();
    const collectedTools: ToolCall[] = [];
    let assistantContent = "";

    try {
      const chatHistory = chatMessages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          documentContent: doc?.content ?? "",
          chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await processSSEStream(response, {
        onPlan(steps) {
          addActivityEvent({
            type: "plan",
            summary: `Plan: ${steps.join(" → ")}`,
            detail: `${steps.length} steps`,
          });
        },

        onToolCall(tc) {
          const toolCall: ToolCall = {
            id: crypto.randomUUID(),
            toolName: tc.toolName,
            input: tc.input,
            status: "running",
          };
          collectedTools.push(toolCall);
          addActivityEvent({
            type: "tool_call",
            summary: `Calling ${tc.toolName}`,
            detail: JSON.stringify(tc.input).slice(0, 100),
          });
        },

        onToolResult(tr) {
          const existing = collectedTools.find(
            (t) => t.toolName === tr.toolName && t.status === "running"
          );
          if (existing) {
            existing.status = "completed";
            existing.output = tr.output;
          }
          addActivityEvent({
            type: "tool_call",
            summary: `${tr.toolName} completed`,
            detail: tr.output.slice(0, 120),
          });
        },

        onMessage(content) {
          assistantContent = content;
        },

        onEdits(edits) {
          for (const edit of edits) {
            addPendingEdit({
              type: edit.type,
              description: edit.description,
              reason: edit.reason,
              startLine: edit.startLine,
              endLine: edit.endLine,
              anchor: edit.anchor,
              oldText: edit.oldText,
              newText: edit.newText,
              status: "pending",
            });
          }
          addActivityEvent({
            type: "edit_proposed",
            summary: `Proposed ${edits.length} edit(s)`,
            detail: edits.map((e) => e.description).join(", "),
          });
        },

        onError(error) {
          const message = formatChatError(error);
          addChatMessage({
            documentId: "",
            role: "assistant",
            content: message,
          });
          addActivityEvent({ type: "error", summary: message });
        },

        onDone() {
          if (assistantContent) {
            addChatMessage({
              documentId: "",
              role: "assistant",
              content: assistantContent,
              toolCalls: collectedTools.length > 0 ? [...collectedTools] : undefined,
            });
          }
          addActivityEvent({ type: "completed", summary: "Agent finished" });
        },
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      addChatMessage({
        documentId: "",
        role: "assistant",
        content: `Something went wrong: ${errMsg}`,
      });
      addActivityEvent({ type: "error", summary: errMsg });
    } finally {
      setAgentRunning(false);
    }
  }, [input, isAgentRunning, chatMessages, addChatMessage, addActivityEvent, addPendingEdit, setAgentRunning, getActiveDocument]);

  if (!chatOpen) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { id: "chat" as TabId, label: "Chat", icon: <MessageSquare size={13} /> },
          { id: "activity" as TabId, label: "Activity", icon: <Activity size={13} /> },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              tab === t.id
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "activity" ? (
        <ActivityTab />
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm px-6 text-center">
                <Sparkles size={24} className="mb-3 text-indigo-400" />
                <p className="font-medium text-gray-600">ClawDocs AI</p>
                <p className="text-xs mt-1 text-gray-400">
                  Ask questions, generate reports, or request edits to your document
                </p>
              </div>
            )}
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isAgentRunning && (
              <div className="flex items-center gap-2 text-xs text-indigo-500">
                <Loader2 size={13} className="animate-spin" />
                Agent is working...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-indigo-300 transition-colors p-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your data..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none resize-none px-3 py-2 max-h-32"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isAgentRunning}
                className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-colors shrink-0"
              >
                {isAgentRunning ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const s = props.size ?? 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" /><path d="M22 5h-4" />
    </svg>
  );
}

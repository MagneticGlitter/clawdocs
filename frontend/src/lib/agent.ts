import { Annotation, StateGraph, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import type { DynamicStructuredTool } from "@langchain/core/tools";

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

const AgentAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  documentSnapshot: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  plan: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  toolResultsSummary: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  proposedEdits: Annotation<ProposedEdit[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  finalResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

export type AgentState = typeof AgentAnnotation.State;

export interface ProposedEdit {
  type: "replace" | "replace_all" | "insert" | "delete";
  description: string;
  reason: string;
  startLine?: number;
  endLine?: number;
  anchor?: string;
  oldText?: string;
  newText?: string;
}

/* ------------------------------------------------------------------ */
/*  Model                                                              */
/* ------------------------------------------------------------------ */

function getModel() {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 4096,
  });
}

/* ------------------------------------------------------------------ */
/*  Node factories — closures over the dynamic tools array             */
/* ------------------------------------------------------------------ */

function makePlannerNode(toolNames: string[]) {
  const toolList = toolNames.map((n) => `- ${n}`).join("\n");

  return async function plannerNode(
    state: AgentState
  ): Promise<Partial<AgentState>> {
    const model = getModel();
    const lastUserMsg =
      [...state.messages].reverse().find((m) => m._getType() === "human")?.content ?? "";

    const resp = await model.invoke([
      new SystemMessage(
        `You are the planning module of ClawDocs, a markdown-native AI report editor.

The user has a markdown document open and is asking you to help with it.

You have access to these tools:
${toolList}

Given the user's request and the current document, produce a short numbered plan (3-6 steps) of what you need to do. Each step should be one of the tool names listed above, or one of these internal steps:
- analyze: reason about the data you've gathered
- draft_edits: write proposed changes to the document

Respond ONLY with a JSON array of strings, one per step. No explanation.
Example: ["inspect_schema","query_data","lookup_metric","analyze","draft_edits"]`
      ),
      new HumanMessage(
        `## Current Document\n\n${state.documentSnapshot}\n\n## User Request\n\n${lastUserMsg}`
      ),
    ]);

    let plan: string[] = [];
    try {
      const content = typeof resp.content === "string" ? resp.content : JSON.stringify(resp.content);
      const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      plan = JSON.parse(cleaned);
    } catch {
      plan = [...toolNames.slice(0, 2), "analyze", "draft_edits"];
    }

    return {
      plan,
      messages: [new AIMessage(`Plan: ${plan.join(" → ")}`)],
    };
  };
}

function makeToolCallerNode(tools: DynamicStructuredTool[]) {
  const toolNames = tools.map((t) => t.name);

  return async function toolCallerNode(
    state: AgentState
  ): Promise<Partial<AgentState>> {
    const model = getModel().bindTools(tools);

    const toolSteps = state.plan.filter((s) => toolNames.includes(s));

    const resp = await model.invoke([
      new SystemMessage(
        `You are the tool-calling module of ClawDocs. You have access to data tools.

Based on the plan and user request, call the appropriate tools to gather the data needed.
Your plan steps that need tools: ${toolSteps.join(", ")}

Call tools now. You may call multiple tools.`
      ),
      ...state.messages,
    ]);

    return { messages: [resp] };
  };
}

/* ------------------------------------------------------------------ */
/*  Node: reflection — decides if more tools are needed               */
/* ------------------------------------------------------------------ */

async function reflectionNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const model = getModel();

  const toolOutputs = state.messages
    .filter((m) => m._getType() === "tool")
    .map((m) => `[${(m as { name?: string }).name ?? "tool"}]: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`)
    .join("\n\n");

  const resp = await model.invoke([
    new SystemMessage(
      `You are the reflection module. You have gathered tool results.
Review them and decide: do you have enough information to write the document edits, or do you need more tool calls?

Tool results so far:
${toolOutputs}

If you have enough data, respond with exactly: ENOUGH
If you need more, respond with exactly: NEED_MORE followed by a brief explanation.`
    ),
    ...state.messages,
  ]);

  const content = typeof resp.content === "string" ? resp.content : "";

  return {
    toolResultsSummary: toolOutputs,
    messages: [new AIMessage(content.startsWith("ENOUGH") ? "Data gathering complete. Moving to draft edits." : content)],
  };
}

/* ------------------------------------------------------------------ */
/*  Node: doc_writer — proposes structured PatchEdits                 */
/* ------------------------------------------------------------------ */

async function docWriterNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const model = getModel();

  const resp = await model.invoke([
    new SystemMessage(
      `You are the document editor module of ClawDocs.

Given the user's request, the current document, and the data gathered from tools, propose edits to the markdown document.

Return a JSON object with two fields:
1. "message": A conversational summary of what you found and what changes you're proposing (2-4 sentences).
2. "edits": An array of edit operations. Each edit is an object with:
   - "type": "replace" | "replace_all" | "insert" | "delete"
   - "description": Short human-readable description of the change
   - "reason": Why this change is needed
   - "oldText": (for replace/delete) A short verbatim substring from the current document that uniquely identifies the text to replace. Use 1-3 lines maximum — just enough to match the location.
   - "newText": (for replace/replace_all/insert) The new markdown text
   - "anchor": (for insert) The heading or text after which to insert

IMPORTANT RULES:
- If the user asks to rewrite or replace the ENTIRE document, use "type": "replace_all" with NO "oldText" field. Just provide "newText" with the complete new document.
- For partial edits, use "type": "replace" with a short unique "oldText" snippet (1-3 lines) that appears verbatim in the document, and "newText" with the replacement.
- NEVER try to put the entire document content in "oldText" — it will fail to match. Use "replace_all" instead.

CHARTS AND TABLES:
When you have data from tool queries and the user wants visualizations, embed them using custom fenced blocks:

For charts, use a clawchart block with inline data:
\`\`\`clawchart
type: line
source: weekly_retention
x: week
y: retention_rate
title: Weekly Retention by Region
data:
  - { week: "W01", US: 0.46, Canada: 0.41, UK: 0.39, Germany: 0.38 }
  - { week: "W02", US: 0.455, Canada: 0.405, UK: 0.392, Germany: 0.379 }
\`\`\`

For tables, use a clawtable block with inline data:
\`\`\`clawtable
source: retention_breakdown
columns: [region, platform, users, retention_rate]
data:
  - { region: "US", platform: "iOS", users: 1360000, retention_rate: "46%" }
  - { region: "Canada", platform: "iOS", users: 194000, retention_rate: "36%" }
\`\`\`

ALWAYS include the "data" field with actual values from your tool results. The chart/table components need this data to render correctly.

Respond ONLY with valid JSON. No markdown fences.`
    ),
    new HumanMessage(
      `## Current Document\n\n${state.documentSnapshot}\n\n## Data Gathered\n\n${state.toolResultsSummary}\n\n## User Request\n\n${[...state.messages].reverse().find((m) => m._getType() === "human")?.content ?? ""}`
    ),
  ]);

  let message = "";
  let edits: ProposedEdit[] = [];

  try {
    const content = typeof resp.content === "string" ? resp.content : JSON.stringify(resp.content);
    const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    message = parsed.message ?? "";
    edits = (parsed.edits ?? []).map((e: Record<string, unknown>) => ({
      type: e.type ?? "insert",
      description: e.description ?? "Edit",
      reason: e.reason ?? "",
      oldText: e.oldText,
      newText: e.newText,
      anchor: e.anchor,
      startLine: e.startLine,
      endLine: e.endLine,
    }));
  } catch {
    message = typeof resp.content === "string" ? resp.content : "I've analyzed the data but had trouble formatting the edits. Please try again.";
  }

  return {
    proposedEdits: edits,
    finalResponse: message,
    messages: [new AIMessage(message)],
  };
}

/* ------------------------------------------------------------------ */
/*  Routing                                                            */
/* ------------------------------------------------------------------ */

function shouldCallTools(
  state: AgentState
): "tool_executor" | "reflection" {
  const lastMsg = state.messages[state.messages.length - 1];
  if (
    lastMsg._getType() === "ai" &&
    (lastMsg as AIMessage).tool_calls &&
    (lastMsg as AIMessage).tool_calls!.length > 0
  ) {
    return "tool_executor";
  }
  return "reflection";
}

function shouldContinueAfterReflection(
  state: AgentState
): "tool_caller" | "doc_writer" {
  const lastMsg = state.messages[state.messages.length - 1];
  const content = typeof lastMsg.content === "string" ? lastMsg.content : "";
  if (content.includes("NEED_MORE")) {
    return "tool_caller";
  }
  return "doc_writer";
}

/* ------------------------------------------------------------------ */
/*  Graph                                                              */
/* ------------------------------------------------------------------ */

export function buildGraph(tools: DynamicStructuredTool[]) {
  const toolNames = tools.map((t) => t.name);
  const toolExecutor = new ToolNode(tools);

  const graph = new StateGraph(AgentAnnotation)
    .addNode("planner", makePlannerNode(toolNames))
    .addNode("tool_caller", makeToolCallerNode(tools))
    .addNode("tool_executor", toolExecutor)
    .addNode("reflection", reflectionNode)
    .addNode("doc_writer", docWriterNode)
    .addEdge("__start__", "planner")
    .addEdge("planner", "tool_caller")
    .addConditionalEdges("tool_caller", shouldCallTools)
    .addEdge("tool_executor", "reflection")
    .addConditionalEdges("reflection", shouldContinueAfterReflection)
    .addEdge("doc_writer", END);

  return graph.compile();
}

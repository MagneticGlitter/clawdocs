import { NextRequest } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { buildGraph } from "@/lib/agent";
import type { AgentState } from "@/lib/agent";
import { connectMCP, discoverAndBuildTools } from "@/lib/mcp-client";
import { getMCPTools } from "@/lib/mcp";

export const runtime = "nodejs";
export const maxDuration = 60;

interface StreamEvent {
  type: "plan" | "tool_call" | "tool_result" | "reflection" | "edits" | "message" | "done" | "error";
  data: Record<string, unknown>;
}

function encodeSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function resolveTools() {
  const mcpUrl = process.env.MCP_SERVER_URL;
  if (mcpUrl) {
    try {
      const client = await connectMCP(mcpUrl);
      const tools = await discoverAndBuildTools(client);
      if (tools.length > 0) return tools;
    } catch (err) {
      console.warn(
        "MCP server connection failed, falling back to stub tools:",
        err instanceof Error ? err.message : err
      );
    }
  }
  return getMCPTools();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, documentContent, chatHistory } = body as {
    message: string;
    documentContent: string;
    chatHistory?: { role: string; content: string }[];
  };

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      encodeSSE({
        type: "error",
        data: { message: "OPENAI_API_KEY is not configured. Add it to .env.local to enable the AI agent." },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const tools = await resolveTools();
        const graph = buildGraph(tools);

        const priorMessages = (chatHistory ?? []).map((m) =>
          m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
        );

        const initialState = {
          messages: [...priorMessages, new HumanMessage(message)],
          documentSnapshot: documentContent || "",
          plan: [] as string[],
          toolResultsSummary: "",
          proposedEdits: [] as AgentState["proposedEdits"],
          finalResponse: "",
        };

        const streamResult = await graph.stream(initialState, {
          streamMode: "updates" as const,
        });

        for await (const chunk of streamResult) {
          for (const [nodeName, update] of Object.entries(chunk)) {
            const nodeUpdate = update as Partial<AgentState>;

            if (nodeName === "planner" && nodeUpdate.plan) {
              controller.enqueue(
                encoder.encode(
                  encodeSSE({
                    type: "plan",
                    data: { steps: nodeUpdate.plan },
                  })
                )
              );
            }

            if (nodeName === "tool_caller") {
              const msgs = nodeUpdate.messages ?? [];
              for (const msg of msgs) {
                if (msg._getType() === "ai") {
                  const aiMsg = msg as { tool_calls?: { name: string; args: Record<string, unknown> }[] };
                  if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
                    for (const tc of aiMsg.tool_calls) {
                      controller.enqueue(
                        encoder.encode(
                          encodeSSE({
                            type: "tool_call",
                            data: {
                              toolName: tc.name,
                              input: tc.args,
                              status: "running",
                            },
                          })
                        )
                      );
                    }
                  }
                }
              }
            }

            if (nodeName === "tool_executor") {
              const msgs = nodeUpdate.messages ?? [];
              for (const msg of msgs) {
                if (msg._getType() === "tool") {
                  const toolMsg = msg as { name?: string; content: unknown };
                  controller.enqueue(
                    encoder.encode(
                      encodeSSE({
                        type: "tool_result",
                        data: {
                          toolName: toolMsg.name ?? "unknown",
                          output: typeof toolMsg.content === "string"
                            ? toolMsg.content.slice(0, 500)
                            : JSON.stringify(toolMsg.content).slice(0, 500),
                          status: "completed",
                        },
                      })
                    )
                  );
                }
              }
            }

            if (nodeName === "reflection") {
              controller.enqueue(
                encoder.encode(
                  encodeSSE({
                    type: "reflection",
                    data: {
                      summary: nodeUpdate.toolResultsSummary?.slice(0, 300) ?? "",
                    },
                  })
                )
              );
            }

            if (nodeName === "doc_writer") {
              if (nodeUpdate.finalResponse) {
                controller.enqueue(
                  encoder.encode(
                    encodeSSE({
                      type: "message",
                      data: { content: nodeUpdate.finalResponse },
                    })
                  )
                );
              }
              if (nodeUpdate.proposedEdits && nodeUpdate.proposedEdits.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    encodeSSE({
                      type: "edits",
                      data: { edits: nodeUpdate.proposedEdits },
                    })
                  )
                );
              }
            }
          }
        }

        controller.enqueue(encoder.encode(encodeSSE({ type: "done", data: {} })));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            encodeSSE({ type: "error", data: { message: errMsg } })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

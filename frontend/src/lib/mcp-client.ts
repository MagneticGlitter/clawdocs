import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Connect to a remote MCP server via Streamable HTTP transport.
 */
export async function connectMCP(serverUrl: string): Promise<Client> {
  const client = new Client({ name: "clawdocs-frontend", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
  await client.connect(transport);
  return client;
}

/**
 * Convert a JSON Schema property to a Zod schema.
 * Handles the common types that MCP tools use.
 */
function jsonSchemaPropertyToZod(
  prop: Record<string, unknown>
): z.ZodTypeAny {
  const type = prop.type as string | undefined;
  const description = prop.description as string | undefined;

  let schema: z.ZodTypeAny;

  switch (type) {
    case "number":
    case "integer":
      schema = z.number();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "array":
      schema = z.array(z.unknown());
      break;
    case "object":
      schema = z.record(z.string(), z.unknown());
      break;
    case "string":
    default:
      schema = z.string();
      break;
  }

  if (description) {
    schema = schema.describe(description);
  }

  return schema;
}

/**
 * Convert an MCP tool's JSON Schema inputSchema into a Zod object schema.
 */
function buildZodSchema(
  inputSchema?: Record<string, unknown>
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  if (!inputSchema) return z.object({});

  const properties = inputSchema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  const required = (inputSchema.required as string[]) || [];

  if (!properties || Object.keys(properties).length === 0) {
    return z.object({});
  }

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, prop] of Object.entries(properties)) {
    let fieldSchema = jsonSchemaPropertyToZod(prop);
    if (!required.includes(key)) {
      fieldSchema = fieldSchema.optional();
    }
    shape[key] = fieldSchema;
  }

  return z.object(shape);
}

/**
 * Discover all tools from an MCP server and convert them into
 * LangChain DynamicStructuredTool instances that the LangGraph
 * agent can bind and invoke.
 */
export async function discoverAndBuildTools(
  client: Client
): Promise<DynamicStructuredTool[]> {
  const response = await client.listTools();
  const mcpTools = response.tools;

  return mcpTools.map((tool) => {
    const zodSchema = buildZodSchema(
      tool.inputSchema as Record<string, unknown> | undefined
    );

    return new DynamicStructuredTool({
      name: tool.name,
      description: tool.description ?? `MCP tool: ${tool.name}`,
      schema: zodSchema,
      func: async (args: Record<string, unknown>) => {
        const result = await client.callTool({
          name: tool.name,
          arguments: args,
        });

        const textParts = (
          result.content as Array<{ type: string; text?: string }>
        )
          .filter((c) => c.type === "text" && c.text)
          .map((c) => c.text!);

        return textParts.join("\n") || JSON.stringify(result.content);
      },
    });
  });
}

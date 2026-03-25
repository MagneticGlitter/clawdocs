import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export interface MCPToolCall {
  tool: string;
  input: Record<string, unknown>;
}

export interface MCPToolResult {
  tool: string;
  output: unknown;
  status: "success" | "error";
  durationMs: number;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  endpoint: string;
  type: "data" | "knowledge";
  enabled: boolean;
}

const DEMO_DATA: Record<string, unknown> = {
  query_supabase: {
    rows: [
      { region: "US", week: "W10", retention_rate: 0.44 },
      { region: "US", week: "W11", retention_rate: 0.43 },
      { region: "US", week: "W12", retention_rate: 0.44 },
      { region: "US", week: "W13", retention_rate: 0.43 },
      { region: "Canada", week: "W10", retention_rate: 0.41 },
      { region: "Canada", week: "W11", retention_rate: 0.40 },
      { region: "Canada", week: "W12", retention_rate: 0.34 },
      { region: "Canada", week: "W13", retention_rate: 0.33 },
      { region: "UK", week: "W10", retention_rate: 0.39 },
      { region: "UK", week: "W13", retention_rate: 0.40 },
      { region: "Germany", week: "W10", retention_rate: 0.38 },
      { region: "Germany", week: "W13", retention_rate: 0.38 },
    ],
    rowCount: 12,
  },
  inspect_schema: {
    tables: [
      { name: "weekly_retention", columns: ["region", "week", "retention_rate", "platform", "users"] },
      { name: "daily_active_users", columns: ["date", "region", "platform", "dau"] },
      { name: "metric_definitions", columns: ["name", "definition", "owner", "caveats"] },
    ],
  },
  lookup_metric: {
    name: "retention_rate",
    definition: "Percentage of users who return to the product within 7 days of their first session in a given week cohort.",
    owner: "Data Team",
    caveats: "Excludes bot traffic. Calculated on a rolling 7-day window. Does not distinguish between platforms unless explicitly filtered.",
    source_link: "https://wiki.internal/metrics/retention_rate",
  },
  lookup_column: {
    table: "weekly_retention",
    column: "retention_rate",
    meaning: "7-day rolling retention as a decimal (0.0–1.0)",
    type: "numeric(5,4)",
    examples: ["0.4400", "0.3300"],
  },
};

export async function callTool(call: MCPToolCall): Promise<MCPToolResult> {
  const start = Date.now();
  const output = DEMO_DATA[call.tool] ?? { error: `Unknown tool: ${call.tool}` };
  return {
    tool: call.tool,
    output,
    status: DEMO_DATA[call.tool] ? "success" : "error",
    durationMs: Date.now() - start,
  };
}

/**
 * LangChain DynamicStructuredTool wrappers for MCP tools.
 * These are bound to the LLM via .bindTools() so OpenAI
 * can invoke them through function calling.
 */
export function getMCPTools(): DynamicStructuredTool[] {
  return [
    new DynamicStructuredTool({
      name: "query_supabase",
      description:
        "Run a read-only SQL query against approved Supabase reporting views. Returns rows of data. Use this to fetch actual numbers, metrics, and breakdowns.",
      schema: z.object({
        query: z.string().describe("The SQL SELECT query to run against the reporting schema"),
      }),
      func: async ({ query }) => {
        const result = await callTool({ tool: "query_supabase", input: { query } });
        return JSON.stringify(result.output);
      },
    }),
    new DynamicStructuredTool({
      name: "inspect_schema",
      description:
        "List all available tables and their columns in the reporting schema. Use this first to understand what data is available before writing queries.",
      schema: z.object({}),
      func: async () => {
        const result = await callTool({ tool: "inspect_schema", input: {} });
        return JSON.stringify(result.output);
      },
    }),
    new DynamicStructuredTool({
      name: "lookup_metric",
      description:
        "Look up the official definition, owner, and caveats for a named business metric. Use this to ensure you describe metrics accurately in reports.",
      schema: z.object({
        name: z.string().describe("The metric name to look up, e.g. 'retention_rate'"),
      }),
      func: async ({ name }) => {
        const result = await callTool({ tool: "lookup_metric", input: { name } });
        return JSON.stringify(result.output);
      },
    }),
    new DynamicStructuredTool({
      name: "lookup_column",
      description:
        "Look up the meaning and type of a specific column in a table. Use this to understand what a column represents before using it in analysis.",
      schema: z.object({
        table: z.string().describe("The table name"),
        column: z.string().describe("The column name"),
      }),
      func: async ({ table, column }) => {
        const result = await callTool({ tool: "lookup_column", input: { table, column } });
        return JSON.stringify(result.output);
      },
    }),
  ];
}

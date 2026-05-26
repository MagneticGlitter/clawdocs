import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase } from "./supabase.js";

const SUPABASE_UNAVAILABLE_PATTERNS = [
  /fetch failed/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /503/i,
  /service unavailable/i,
  /temporarily unavailable/i,
  /project is not active/i,
  /database is not accepting connections/i,
  /could not connect to the database/i,
  /connection refused/i,
];

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error ?? "Unknown error");
}

function isSupabaseUnavailableError(error: unknown): boolean {
  const message = extractErrorMessage(error);
  return SUPABASE_UNAVAILABLE_PATTERNS.some((pattern) => pattern.test(message));
}

function toolErrorText(operation: string, error: unknown): string {
  const message = extractErrorMessage(error);

  if (isSupabaseUnavailableError(error)) {
    return `SUPABASE_UNAVAILABLE: Supabase is down right now. Please contact admin. (${operation})`;
  }

  return `${operation} failed: ${message}`;
}

export function registerTools(server: McpServer) {
  server.tool(
    "query_data",
    "Run a read-only SQL SELECT query against the reporting schema. Returns rows as JSON. Use inspect_schema first to understand available tables.",
    {
      query: z
        .string()
        .describe("A SQL SELECT query to run against the reporting tables"),
    },
    async ({ query }) => {
      const trimmed = query.trim();
      if (!/^\s*SELECT/i.test(trimmed)) {
        return {
          content: [
            { type: "text" as const, text: "Error: Only SELECT queries are allowed." },
          ],
        };
      }

      const supabase = getSupabase();
      const { data, error } = await supabase.rpc("execute_readonly_query", {
        query_text: trimmed,
      });

      if (error) {
        return {
          content: [
            { type: "text" as const, text: toolErrorText("query_data", error) },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "inspect_schema",
    "List all available reporting tables and their columns. Call this first to understand what data is available before writing queries.",
    {},
    async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc("get_reporting_schema");

      if (error) {
        return {
          content: [
            { type: "text" as const, text: toolErrorText("inspect_schema", error) },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "lookup_metric",
    "Look up the official definition, owner, and caveats for a named business metric. Use this to ensure you describe metrics accurately in reports.",
    {
      name: z.string().describe("The metric name to look up, e.g. 'retention_rate'"),
    },
    async ({ name }) => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("metric_definitions")
        .select("*")
        .ilike("name", `%${name}%`);

      if (error) {
        return {
          content: [
            { type: "text" as const, text: toolErrorText("lookup_metric", error) },
          ],
        };
      }

      if (!data || data.length === 0) {
        return {
          content: [
            { type: "text" as const, text: `No metric found matching "${name}".` },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "lookup_column",
    "Look up the meaning and data type of a specific column in a table. Use this to understand what columns represent before using them in analysis.",
    {
      table: z.string().describe("The table name"),
      column: z.string().describe("The column name"),
    },
    async ({ table, column }) => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("data_dictionary")
        .select("*")
        .eq("table_name", table)
        .eq("column_name", column);

      if (error) {
        return {
          content: [
            { type: "text" as const, text: toolErrorText("lookup_column", error) },
          ],
        };
      }

      if (!data || data.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No dictionary entry for ${table}.${column}. Try inspect_schema to see available tables.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data[0], null, 2),
          },
        ],
      };
    }
  );
}

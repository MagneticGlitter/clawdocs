# ClawDocs (Try it [now](https://clawdocs.lol). VIDEO DEMO: [youtu.be](https://youtu.be/j_ZctYP8Sho?si=EAFic7wOTn2teFtO))

A markdown-native AI report editor that can query your data, understand your internal definitions, and turn that into editable documents with inline AI patches.

## Problem

As a product manager, have you ever used Gemini in Google Docs to write your data reports?
It sounds fast... until the assistant “fills in” numbers you never gave it, or misunderstands what a metric *actually* means in your org.

What if your assistant had real context from your internal data warehouse (and your metric dictionary) so it could ground insights in accurate, up-to-the-minute data?

## Introducing ClawDocs

ClawDocs is an AI agent writer that connects to your data through a standard MCP server, fetches accurate info in real time, and writes into your markdown document with structured inline edits.

Example schema used in the project (reporting tables): columns + data types

| Reporting table | Column name | Data type |
|---|---|---|
| `weekly_retention` | `region` | `text` |
| `weekly_retention` | `week` | `text` |
| `weekly_retention` | `platform` | `text` |
| `weekly_retention` | `users` | `integer` |
| `weekly_retention` | `retention_rate` | `numeric(5,4)` |
| `daily_active_users` | `date` | `date` |
| `daily_active_users` | `region` | `text` |
| `daily_active_users` | `platform` | `text` |
| `daily_active_users` | `dau` | `integer` |
| `revenue_by_month` | `region` | `text` |
| `revenue_by_month` | `month` | `text` |
| `revenue_by_month` | `revenue` | `numeric(12,2)` |
| `revenue_by_month` | `currency` | `text` |
| `metric_definitions` | `name` | `text` |
| `metric_definitions` | `definition` | `text` |
| `metric_definitions` | `owner` | `text` |
| `metric_definitions` | `caveats` | `text` |
| `metric_definitions` | `source_link` | `text` |
| `data_dictionary` | `table_name` | `text` |
| `data_dictionary` | `column_name` | `text` |
| `data_dictionary` | `meaning` | `text` |
| `data_dictionary` | `type` | `text` |
| `data_dictionary` | `examples` | `text` |

Infra:
- Vercel for the frontend (Next.js) with rate limiting on `POST /api/chat`
- MCP server on Cloud Run (Express + `@modelcontextprotocol/sdk`) wrapping Supabase read-only query tools

## License
Licensed under the GNU Affero General Public License v3 (AGPL-3.0-or-later). See the `LICENSE` file for the full text.

## Architecture

```
clawdocs/
├── frontend/       Next.js app — editor, preview, chat, LangGraph agent
├── mcp-server/     Standalone MCP server — connects to Supabase, exposes data tools
```

The frontend is a generic MCP client — it discovers tools from whatever MCP server you point it at. The MCP server is a separate deployable service that wraps Supabase.

## Quick Start

### 1. Set up Supabase

Run `mcp-server/seed.sql` in your Supabase SQL editor to create the reporting tables, helper functions, and seed data.

### 2. Start the MCP server

```bash
cd mcp-server
cp .env .env.local
# Edit .env.local with your Supabase URL and service role key
npm install
npm run dev
```

The MCP server runs on `http://localhost:4000/mcp`.

### 3. Start the frontend

```bash
cd frontend
cp .env.local.example .env.local  # or edit the existing .env.local
# Set OPENAI_API_KEY and MCP_SERVER_URL=http://localhost:4000/mcp
npm install
npm run dev
```

Open `http://localhost:3000`.

## MCP Server

The MCP server exposes four tools via the standard Model Context Protocol (Streamable HTTP transport):

| Tool | Description |
|------|-------------|
| `query_data` | Run read-only SQL SELECT queries against reporting tables |
| `inspect_schema` | List available tables and their columns |
| `lookup_metric` | Look up business metric definitions |
| `lookup_column` | Look up column meanings from the data dictionary |

Any MCP-compatible client can connect to this server. The frontend auto-discovers available tools at startup.

## Deployment

The MCP server includes a `Dockerfile` for deploying to GCP Cloud Run or any container platform. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as environment variables.

Current Cloud Run URL:
- `https://clawdocs-mcp-server-zi5phqrb6q-uc.a.run.app`

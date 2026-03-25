# ClawDocs

A markdown-native AI report editor that can query your data, understand your internal definitions, and turn that into editable documents with inline AI patches.

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

/**
 * Supabase client placeholder.
 *
 * Milestone 4: Replace with actual @supabase/supabase-js client
 * initialized with env vars NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseClient(_config?: SupabaseConfig) {
  // Will be: createClient(config.url, config.anonKey)
  console.warn("Supabase client not yet configured — using local state");
  return null;
}

/**
 * SQL schema for ClawDocs V1 (to be run in Supabase SQL editor):
 *
 * CREATE TABLE documents (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   workspace_id UUID,
 *   title TEXT NOT NULL DEFAULT 'Untitled',
 *   content_markdown TEXT NOT NULL DEFAULT '',
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 *
 * CREATE TABLE document_versions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
 *   content_markdown TEXT NOT NULL,
 *   created_by TEXT NOT NULL DEFAULT 'user',
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 *
 * CREATE TABLE chats (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
 *   role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
 *   content TEXT NOT NULL,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 *
 * CREATE TABLE tool_runs (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
 *   tool_name TEXT NOT NULL,
 *   input_json JSONB NOT NULL DEFAULT '{}',
 *   output_json JSONB,
 *   status TEXT NOT NULL DEFAULT 'pending',
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 *
 * CREATE TABLE metric_definitions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name TEXT NOT NULL,
 *   definition TEXT,
 *   owner TEXT,
 *   caveats TEXT,
 *   source_link TEXT
 * );
 *
 * CREATE TABLE data_dictionary (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   table_name TEXT NOT NULL,
 *   column_name TEXT NOT NULL,
 *   meaning TEXT,
 *   type TEXT,
 *   examples TEXT
 * );
 */

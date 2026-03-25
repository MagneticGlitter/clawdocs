import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/documents — list documents
 * POST /api/documents — create document
 *
 * Milestone 4: will wire to Supabase.
 * For now, document state lives in the client store.
 */
export async function GET() {
  return NextResponse.json({
    message: "Document API stub — client-side store is the current source of truth",
    documents: [],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    message: "Document created (stub)",
    document: {
      id: crypto.randomUUID(),
      title: body.title ?? "Untitled",
      content: body.content ?? "",
      createdAt: new Date().toISOString(),
    },
  });
}

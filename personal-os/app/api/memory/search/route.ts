import { NextResponse } from "next/server";
import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";
import { openaiClient, EMBEDDING_MODEL } from "@/lib/llm/openai";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const query = body?.query;
  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const embeddingResponse = await openaiClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0]?.embedding;

  const db = supabaseAdmin();
  const { data, error } = await db.rpc("match_memory_chunks", {
    query_embedding: queryEmbedding,
    match_user_id: currentUserId(),
    match_count: 20,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data });
}

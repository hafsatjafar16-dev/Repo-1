import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";
import { openaiClient, EMBEDDING_MODEL } from "@/lib/llm/openai";
import { anthropicClient, anthropicModel } from "@/lib/llm/anthropic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = body?.question;
  if (typeof question !== "string" || !question.trim()) {
    return new Response("question is required", { status: 400 });
  }

  const embeddingResponse = await openaiClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: question,
  });
  const queryEmbedding = embeddingResponse.data[0]?.embedding;

  const db = supabaseAdmin();
  const { data: matches, error } = await db.rpc("match_memory_chunks", {
    query_embedding: queryEmbedding,
    match_user_id: currentUserId(),
    match_count: 20,
  });
  if (error) return new Response(error.message, { status: 500 });

  const context = (matches ?? [])
    .map((m: { id: string; text: string }) => `[${m.id}] ${m.text.slice(0, 200)}`)
    .join("\n");

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const messageStream = anthropicClient().messages.stream({
          model: anthropicModel(),
          max_tokens: 1024,
          system:
            "You are the user's personal assistant. Answer the question using ONLY the context " +
            "provided. Cite sources by referring to capture IDs in [brackets]. " +
            "If you don't have enough context, say so.",
          messages: [
            { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
          ],
        });

        messageStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });
        await messageStream.finalMessage();
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[error: ${(err as Error).message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

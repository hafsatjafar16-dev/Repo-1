import { NextResponse } from "next/server";
import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";
import { anthropicClient, anthropicModel } from "@/lib/llm/anthropic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const query = body?.query;
  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: tasks, error } = await db
    .from("tasks")
    .select("id, title, description, urgency, key, tags, due_date")
    .eq("user_id", currentUserId())
    .is("completed_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tasks?.length) return NextResponse.json({ ids: [] });

  const message = await anthropicClient().messages.create({
    model: anthropicModel(),
    max_tokens: 512,
    system:
      "You match a natural-language request against a list of open tasks. " +
      "Return ONLY a JSON array of matching task ids, most relevant first. No prose.",
    messages: [
      {
        role: "user",
        content: `Request: "${query}"\n\nTasks:\n${JSON.stringify(tasks, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  let ids: string[] = [];
  try {
    const parsed = JSON.parse(textBlock?.type === "text" ? textBlock.text : "[]");
    if (Array.isArray(parsed)) {
      const validIds = new Set(tasks.map((t) => t.id));
      ids = parsed.filter((id): id is string => typeof id === "string" && validIds.has(id));
    }
  } catch {
    ids = [];
  }

  return NextResponse.json({ ids });
}

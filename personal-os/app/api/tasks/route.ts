import { NextResponse } from "next/server";
import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "open";

  const db = supabaseAdmin();
  let query = db
    .from("tasks")
    .select("*")
    .eq("user_id", currentUserId())
    .order("priority_score", { ascending: false });

  query = status === "done" ? query.not("completed_at", "is", null) : query.is("completed_at", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: currentUserId(),
      title: body.title,
      description: body.description ?? null,
      urgency: body.urgency ?? "this_week",
      key: body.key ?? false,
      priority_score: body.priority_score ?? 0,
      time_estimate_min: body.time_estimate_min ?? null,
      tags: body.tags ?? [],
      due_date: body.due_date ?? null,
      owner: body.owner ?? null,
      entity_id: body.entity_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}

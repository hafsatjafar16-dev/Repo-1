import { NextResponse } from "next/server";
import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of [
    "title",
    "description",
    "urgency",
    "key",
    "priority_score",
    "time_estimate_min",
    "tags",
    "due_date",
    "owner",
    "entity_id",
  ] as const) {
    if (key in body) updates[key] = body[key];
  }
  if ("completed" in body) {
    updates.completed_at = body.completed ? new Date().toISOString() : null;
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", currentUserId())
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { error } = await db.from("tasks").delete().eq("id", id).eq("user_id", currentUserId());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("entities")
    .select("*")
    .eq("user_id", currentUserId())
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entities: data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.kind) {
    return NextResponse.json({ error: "name and kind are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("entities")
    .insert({
      user_id: currentUserId(),
      name: body.name,
      kind: body.kind,
      metadata: body.metadata ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entity: data }, { status: 201 });
}

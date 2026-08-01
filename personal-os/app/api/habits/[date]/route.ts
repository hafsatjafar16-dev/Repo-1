import { NextResponse } from "next/server";
import { mergeDailyLogNotes } from "@/lib/dailyLogs";

type Context = { params: Promise<{ date: string }> };

export async function POST(request: Request, { params }: Context) {
  const { date } = await params;
  const body = await request.json().catch(() => null);

  if (!Array.isArray(body?.done) || typeof body?.total !== "number") {
    return NextResponse.json({ error: "done[] and total are required" }, { status: 400 });
  }

  const log = await mergeDailyLogNotes(date, {
    habits: { done: body.done, total: body.total },
  });

  return NextResponse.json({ log });
}

import { NextResponse } from "next/server";
import { getDailyLog, getDailyLogsRange, mergeDailyLogNotes } from "@/lib/dailyLogs";

type JournalEntry = { id: string; text: string; at: string };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30);

  const logs = await getDailyLogsRange(days);
  const entries = logs
    .filter((log) => log.notes?.journal)
    .flatMap((log) => (log.notes.journal as JournalEntry[]).map((e) => ({ ...e, date: log.log_date })));

  entries.sort((a, b) => b.at.localeCompare(a.at));
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = body?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const existing = await getDailyLog(today);
  const entries: JournalEntry[] = ((existing?.notes.journal as JournalEntry[] | undefined) ?? []).slice();
  const entry: JournalEntry = { id: crypto.randomUUID(), text, at: new Date().toISOString() };
  entries.push(entry);

  await mergeDailyLogNotes(today, { journal: entries });
  return NextResponse.json({ entry }, { status: 201 });
}

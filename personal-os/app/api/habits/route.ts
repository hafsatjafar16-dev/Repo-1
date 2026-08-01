import { NextResponse } from "next/server";
import { getDailyLogsRange } from "@/lib/dailyLogs";
import type { HabitDay } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30);

  const logs = await getDailyLogsRange(days);
  const habitDays: HabitDay[] = logs
    .filter((log) => log.notes?.habits)
    .map((log) => ({
      date: log.log_date,
      done: (log.notes.habits as { done?: string[] })?.done ?? [],
      total: (log.notes.habits as { total?: number })?.total ?? 6,
    }));

  return NextResponse.json({ days: habitDays });
}

import { NextResponse } from "next/server";
import { getDailyLog, mergeDailyLogNotes, GOALS_SENTINEL_DATE } from "@/lib/dailyLogs";
import type { GoalItem } from "@/lib/types";

export async function GET() {
  const log = await getDailyLog(GOALS_SENTINEL_DATE);
  return NextResponse.json({
    week: (log?.notes.goals_week_items as GoalItem[] | undefined) ?? [],
    month: (log?.notes.goals_month_items as GoalItem[] | undefined) ?? [],
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const scope = body?.scope;
  const items = body?.items;

  if ((scope !== "week" && scope !== "month") || !Array.isArray(items)) {
    return NextResponse.json({ error: "scope ('week'|'month') and items[] are required" }, { status: 400 });
  }

  const key = scope === "week" ? "goals_week_items" : "goals_month_items";
  const log = await mergeDailyLogNotes(GOALS_SENTINEL_DATE, { [key]: items });
  return NextResponse.json({ log });
}

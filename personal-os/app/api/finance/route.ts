import { NextResponse } from "next/server";
import { getDailyLogsRange } from "@/lib/dailyLogs";
import type { FinanceSnapshot } from "@/lib/types";

/** Reads the latest saved snapshot from Supabase. Never triggers the AI pipeline. */
export async function GET() {
  const logs = await getDailyLogsRange(90);
  const withFinance = logs.find((log) => log.notes?.finance);
  const snapshot = (withFinance?.notes.finance as FinanceSnapshot | undefined) ?? null;
  return NextResponse.json({ snapshot });
}

import { NextResponse } from "next/server";
import { getDailyLog, mergeDailyLogNotes } from "@/lib/dailyLogs";
import { weekStartKey } from "@/lib/weekStart";

type ReviewData = {
  wins: string;
  slipped: string;
  openLoops: string;
  followUps: string;
  topThree: string;
  sealed: boolean;
};

const EMPTY: ReviewData = { wins: "", slipped: "", openLoops: "", followUps: "", topThree: "", sealed: false };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week") ?? weekStartKey();

  const log = await getDailyLog(week);
  const review = (log?.notes.review as ReviewData | undefined) ?? EMPTY;
  return NextResponse.json({ week, review });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const week = body?.week ?? weekStartKey();
  const review: ReviewData = {
    wins: body?.review?.wins ?? "",
    slipped: body?.review?.slipped ?? "",
    openLoops: body?.review?.openLoops ?? "",
    followUps: body?.review?.followUps ?? "",
    topThree: body?.review?.topThree ?? "",
    sealed: !!body?.review?.sealed,
  };

  const log = await mergeDailyLogNotes(week, { review });
  return NextResponse.json({ week, log });
}

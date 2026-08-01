import { NextResponse } from "next/server";
import { fetchFinanceWorkbook } from "@/lib/finance/googleSheets";
import { anthropicClient, anthropicModel } from "@/lib/llm/anthropic";
import { mergeDailyLogNotes } from "@/lib/dailyLogs";
import type { FinanceSnapshot } from "@/lib/types";

async function extractSnapshot(tabs: Record<string, unknown[][]>): Promise<FinanceSnapshot> {
  const message = await anthropicClient().messages.create({
    model: anthropicModel(),
    max_tokens: 512,
    system:
      "You extract net worth from a messy personal finance spreadsheet dump (all tabs, as 2D arrays). " +
      "Avoid double-counting a summary tab plus per-category tabs — prefer the summary if one exists. " +
      "Use only the most recent row of any time-series tab. " +
      'Reply with ONLY JSON: { "net_worth": number, "currency": string, "as_of": string, ' +
      '"categories": [{ "name": string, "value": number }] }.',
    messages: [{ role: "user", content: JSON.stringify(tabs).slice(0, 100_000) }],
  });

  const block = message.content.find((b) => b.type === "text");
  const parsed = JSON.parse(block?.type === "text" ? block.text : "{}");
  return {
    net_worth: Number(parsed.net_worth) || 0,
    currency: parsed.currency ?? "EUR",
    as_of: parsed.as_of ?? new Date().toISOString().slice(0, 10),
    categories: Array.isArray(parsed.categories) ? parsed.categories : [],
  };
}

async function runSnapshot() {
  const tabs = await fetchFinanceWorkbook();
  const snapshot = await extractSnapshot(tabs);
  const today = new Date().toISOString().slice(0, 10);
  await mergeDailyLogNotes(today, { finance: snapshot });
  return snapshot;
}

/** Vercel cron hits this daily. Auth via Authorization: Bearer $CRON_SECRET. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const snapshot = await runSnapshot();
  return NextResponse.json({ snapshot });
}

/** Manual refresh button hits this (POST) — page loads must NEVER trigger this automatically. */
export async function POST() {
  const snapshot = await runSnapshot();
  return NextResponse.json({ snapshot });
}

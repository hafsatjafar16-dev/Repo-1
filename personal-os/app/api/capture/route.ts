import { NextResponse } from "next/server";
import { runCapturePipeline } from "@/lib/capture/pipeline";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = body?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const result = await runCapturePipeline({ text, source: "web" });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Capture pipeline failed", err);
    return NextResponse.json({ error: "capture failed" }, { status: 500 });
  }
}

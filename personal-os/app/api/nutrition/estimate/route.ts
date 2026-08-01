import { NextResponse } from "next/server";
import { anthropicClient, anthropicModel } from "@/lib/llm/anthropic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = body?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const message = await anthropicClient().messages.create({
    model: anthropicModel(),
    max_tokens: 256,
    system:
      "Estimate nutrition macros for a described meal. Reply with ONLY JSON: " +
      '{ "kcal": number, "p": number, "c": number, "f": number }. p/c/f are grams.',
    messages: [{ role: "user", content: text }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const parsed = JSON.parse(textBlock?.type === "text" ? textBlock.text : "{}");

  return NextResponse.json({
    kcal: Number(parsed.kcal) || 0,
    p: Number(parsed.p) || 0,
    c: Number(parsed.c) || 0,
    f: Number(parsed.f) || 0,
  });
}

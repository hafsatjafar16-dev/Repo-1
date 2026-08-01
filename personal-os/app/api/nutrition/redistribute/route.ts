import { NextResponse } from "next/server";
import { anthropicClient, anthropicModel } from "@/lib/llm/anthropic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = body?.name;
  const kcal = Number(body?.kcal);
  if (typeof name !== "string" || !name.trim() || !Number.isFinite(kcal)) {
    return NextResponse.json({ error: "name and kcal are required" }, { status: 400 });
  }

  const message = await anthropicClient().messages.create({
    model: anthropicModel(),
    max_tokens: 256,
    system:
      "Given a food name and a target calorie count, estimate a plausible macro split. " +
      'Reply with ONLY JSON: { "p": number, "c": number, "f": number } (grams). ' +
      "Values must satisfy 4*p + 4*c + 9*f ≈ kcal.",
    messages: [{ role: "user", content: `Food: ${name}\nTarget kcal: ${kcal}` }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const parsed = JSON.parse(textBlock?.type === "text" ? textBlock.text : "{}");

  return NextResponse.json({
    p: Number(parsed.p) || 0,
    c: Number(parsed.c) || 0,
    f: Number(parsed.f) || 0,
  });
}

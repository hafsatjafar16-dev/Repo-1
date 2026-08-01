import { anthropicClient, anthropicModel } from "@/lib/llm/anthropic";
import { openaiClient, openaiClassifierModel } from "@/lib/llm/openai";

export type CaptureKind = "task" | "journal" | "note" | "goal";
export type CaptureUrgency = "today" | "this_week" | "this_month" | "someday";

export type Classification = {
  kind: CaptureKind;
  urgency: CaptureUrgency;
  entity_id: string | null;
  tags: string[];
  summary: string;
};

const SYSTEM_PROMPT =
  "You classify a short voice/text capture from a personal productivity system. " +
  "Reply with ONLY JSON matching: " +
  '{ "kind": "task"|"journal"|"note"|"goal", "urgency": "today"|"this_week"|"this_month"|"someday", ' +
  '"entity_id": null, "tags": string[], "summary": string }. ' +
  "entity_id is always null (entity linking happens separately). " +
  "kind=task for anything actionable, journal for reflective/diary entries, " +
  "note for reference info, goal for aspirational/longer-term statements.";

function parseClassification(raw: string): Classification | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.kind === "string" &&
      typeof parsed.urgency === "string" &&
      Array.isArray(parsed.tags) &&
      typeof parsed.summary === "string"
    ) {
      return {
        kind: parsed.kind,
        urgency: parsed.urgency,
        entity_id: null,
        tags: parsed.tags,
        summary: parsed.summary,
      };
    }
  } catch {
    // fall through
  }
  return null;
}

function regexFallback(text: string): Classification {
  const urgency: CaptureUrgency = /\btoday\b/i.test(text) ? "today" : "this_week";
  const kind: CaptureKind = /^(remember|note:|fyi)/i.test(text.trim()) ? "note" : "task";
  return {
    kind,
    urgency,
    entity_id: null,
    tags: [],
    summary: text.slice(0, 140),
  };
}

export async function classifyCapture(text: string): Promise<{
  classification: Classification;
  llm_source: "anthropic" | "openai" | "regex";
}> {
  try {
    const message = await anthropicClient().messages.create({
      model: anthropicModel(),
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });
    const block = message.content.find((b) => b.type === "text");
    const parsed = block?.type === "text" ? parseClassification(block.text) : null;
    if (parsed) return { classification: parsed, llm_source: "anthropic" };
  } catch {
    // fall through to OpenAI
  }

  try {
    const completion = await openaiClient().chat.completions.create({
      model: openaiClassifierModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseClassification(raw);
    if (parsed) return { classification: parsed, llm_source: "openai" };
  } catch {
    // fall through to regex
  }

  return { classification: regexFallback(text), llm_source: "regex" };
}

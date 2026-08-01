import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";
import { classifyCapture, type Classification } from "@/lib/router/classifyCapture";
import { openaiClient, EMBEDDING_MODEL } from "@/lib/llm/openai";
import { mergeDailyLogNotes, GOALS_SENTINEL_DATE, getDailyLog } from "@/lib/dailyLogs";
import type { GoalItem } from "@/lib/types";

export type CaptureResult = {
  captureId: string;
  classification: Classification;
  routedTo: string;
  routedId: string | null;
};

async function embedAndStore(sourceType: string, sourceId: string | null, text: string) {
  const db = supabaseAdmin();
  try {
    const embeddingResponse = await openaiClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    const embedding = embeddingResponse.data[0]?.embedding ?? null;
    await db.from("memory_chunks").insert({
      user_id: currentUserId(),
      source_type: sourceType,
      source_id: sourceId,
      text,
      embedding,
    });
  } catch (err) {
    console.error("embedAndStore failed", err);
  }
}

async function routeCapture(text: string, classification: Classification): Promise<{ routedTo: string; routedId: string | null }> {
  const db = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  switch (classification.kind) {
    case "task": {
      const { data, error } = await db
        .from("tasks")
        .insert({
          user_id: currentUserId(),
          title: classification.summary || text.slice(0, 140),
          description: text,
          urgency: classification.urgency,
          tags: classification.tags,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { routedTo: "tasks", routedId: data.id };
    }

    case "goal": {
      const log = await getDailyLog(GOALS_SENTINEL_DATE);
      const items = ((log?.notes.goals_week_items as GoalItem[] | undefined) ?? []).slice();
      const newItem: GoalItem = { id: crypto.randomUUID(), text: classification.summary || text, done: false };
      items.push(newItem);
      await mergeDailyLogNotes(GOALS_SENTINEL_DATE, { goals_week_items: items });
      return { routedTo: "daily_logs.goals_week_items", routedId: newItem.id };
    }

    case "journal": {
      const existing = await getDailyLog(today);
      const entries = ((existing?.notes.journal as { id: string; text: string; at: string }[] | undefined) ?? []).slice();
      const entry = { id: crypto.randomUUID(), text, at: new Date().toISOString() };
      entries.push(entry);
      await mergeDailyLogNotes(today, { journal: entries });
      return { routedTo: "daily_logs.journal", routedId: entry.id };
    }

    case "note":
    default: {
      const existing = await getDailyLog(today);
      const notes = ((existing?.notes.notes as { id: string; text: string; at: string }[] | undefined) ?? []).slice();
      const entry = { id: crypto.randomUUID(), text, at: new Date().toISOString() };
      notes.push(entry);
      await mergeDailyLogNotes(today, { notes });
      return { routedTo: "daily_logs.notes", routedId: entry.id };
    }
  }
}

export async function runCapturePipeline(params: {
  text: string;
  source: "telegram" | "web";
  audioUrl?: string;
}): Promise<CaptureResult> {
  const db = supabaseAdmin();
  const { text, source, audioUrl } = params;

  const { classification, llm_source } = await classifyCapture(text);

  const { data: capture, error: captureError } = await db
    .from("raw_captures")
    .insert({
      user_id: currentUserId(),
      source,
      raw_text: text,
      audio_url: audioUrl ?? null,
      classification,
      llm_source,
    })
    .select("id")
    .single();
  if (captureError) throw new Error(captureError.message);

  const { routedTo, routedId } = await routeCapture(text, classification);

  await db
    .from("raw_captures")
    .update({ routed_to: routedTo, routed_id: routedId })
    .eq("id", capture.id);

  await db.from("audit_log").insert({
    user_id: currentUserId(),
    action: "capture",
    resource_type: routedTo,
    resource_id: routedId,
    metadata: { source, classification },
  });

  await embedAndStore(classification.kind, routedId, text);

  return { captureId: capture.id, classification, routedTo, routedId };
}

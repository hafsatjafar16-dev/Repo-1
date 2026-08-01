import { NextResponse } from "next/server";
import { openaiClient } from "@/lib/llm/openai";
import { runCapturePipeline } from "@/lib/capture/pipeline";
import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";
import {
  answerCallbackQuery,
  downloadTelegramFile,
  sendTelegramMessage,
  urgencyInlineKeyboard,
} from "@/lib/telegram";

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    from?: { id: number };
    text?: string;
    voice?: { file_id: string };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { chat: { id: number } };
    data?: string;
  };
};

async function transcribeVoice(fileId: string): Promise<string> {
  const audioBuffer = await downloadTelegramFile(fileId);
  const file = new File([audioBuffer], "voice.ogg", { type: "audio/ogg" });
  const transcription = await openaiClient().audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
  return transcription.text;
}

export async function POST(request: Request) {
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) return NextResponse.json({ ok: true });

  const allowedUserId = process.env.TELEGRAM_USER_ID;

  if (update.callback_query) {
    const cq = update.callback_query;
    if (String(cq.from.id) !== allowedUserId) {
      await answerCallbackQuery(cq.id, "Not authorized");
      return NextResponse.json({ ok: true });
    }

    const [, captureId, urgency] = (cq.data ?? "").split(":");
    if (captureId && urgency) {
      const db = supabaseAdmin();
      const { data: capture } = await db
        .from("raw_captures")
        .select("routed_to, routed_id")
        .eq("id", captureId)
        .eq("user_id", currentUserId())
        .maybeSingle();

      if (capture?.routed_to === "tasks" && capture.routed_id) {
        const patch = urgency === "key" ? { key: true } : { urgency };
        await db.from("tasks").update(patch).eq("id", capture.routed_id);
      }
    }
    await answerCallbackQuery(cq.id, `Set to ${urgency}`);
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  if (String(message.from?.id) !== allowedUserId) {
    return NextResponse.json({ ok: true });
  }

  let text = message.text ?? "";
  if (!text && message.voice) {
    try {
      text = await transcribeVoice(message.voice.file_id);
    } catch (err) {
      console.error("Whisper transcription failed", err);
      await sendTelegramMessage(message.chat.id, "Couldn't transcribe that voice note — try again?");
      return NextResponse.json({ ok: true });
    }
  }

  if (!text.trim()) return NextResponse.json({ ok: true });

  try {
    const result = await runCapturePipeline({ text, source: "telegram" });
    await sendTelegramMessage(
      message.chat.id,
      `Captured as ${result.classification.kind} (${result.classification.urgency}): "${result.classification.summary}"`,
      { replyMarkup: result.routedTo === "tasks" ? urgencyInlineKeyboard(result.captureId) : undefined }
    );
  } catch (err) {
    console.error("Capture pipeline failed", err);
    await sendTelegramMessage(message.chat.id, "Something went wrong saving that — check the logs.");
  }

  return NextResponse.json({ ok: true });
}

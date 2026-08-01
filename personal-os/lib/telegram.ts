const API_BASE = "https://api.telegram.org";

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN env var");
  return token;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: { replyMarkup?: unknown }
) {
  await fetch(`${API_BASE}/bot${botToken()}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: options?.replyMarkup,
    }),
  });
}

export function urgencyInlineKeyboard(captureId: string) {
  const row = [
    { text: "Today", callback_data: `urgency:${captureId}:today` },
    { text: "This Week", callback_data: `urgency:${captureId}:this_week` },
    { text: "This Month", callback_data: `urgency:${captureId}:this_month` },
    { text: "Someday", callback_data: `urgency:${captureId}:someday` },
    { text: "Key", callback_data: `urgency:${captureId}:key` },
  ];
  return { inline_keyboard: [row] };
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${API_BASE}/bot${botToken()}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function downloadTelegramFile(fileId: string): Promise<ArrayBuffer> {
  const fileInfoRes = await fetch(`${API_BASE}/bot${botToken()}/getFile?file_id=${fileId}`);
  const fileInfo = await fileInfoRes.json();
  const filePath = fileInfo?.result?.file_path;
  if (!filePath) throw new Error("Telegram getFile failed");

  const fileRes = await fetch(`${API_BASE}/file/bot${botToken()}/${filePath}`);
  return fileRes.arrayBuffer();
}

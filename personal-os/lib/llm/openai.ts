import OpenAI from "openai";

let client: OpenAI | null = null;

export function openaiClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY env var");
    client = new OpenAI({ apiKey });
  }
  return client;
}

export function openaiClassifierModel(): string {
  return process.env.OPENAI_CLASSIFIER_MODEL ?? "gpt-4o-mini";
}

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

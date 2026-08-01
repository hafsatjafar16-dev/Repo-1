import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function anthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY env var");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function anthropicModel(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
}

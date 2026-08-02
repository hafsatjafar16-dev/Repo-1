"use client";

import { useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Panel } from "@/components/dashboard/Panel";
import type { MemoryChunk } from "@/lib/types";

type Match = MemoryChunk & { similarity: number };

export default function BrainPage() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");

    const res = await fetch("/api/memory/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setMatches(data.matches ?? []);
    setLoading(false);
  }

  async function handleAsk() {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: query }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
    }
    setLoading(false);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <Panel index="01" title="Brain — search your memory">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="What did we decide about client X's claim substantiation?"
              className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 text-ink-0 outline-none focus:border-accent"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="label-tracked rounded-md border border-border px-3 py-2 text-ink-1 hover:text-ink-0"
            >
              Search
            </button>
            <button
              onClick={handleAsk}
              disabled={loading}
              className="label-tracked rounded-md border border-accent px-3 py-2 text-accent hover:bg-accent/10"
            >
              Ask
            </button>
          </div>

          {answer && (
            <div className="mt-4 whitespace-pre-wrap rounded-md border border-border bg-bg-elevated p-3 text-sm text-ink-0">
              {answer}
            </div>
          )}

          {matches.length > 0 && (
            <ul className="mt-4 space-y-2">
              {matches.map((m) => (
                <li key={m.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="label-tracked mb-1 flex justify-between">
                    <span>{m.source_type}</span>
                    <span>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-ink-0">{m.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </Shell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Panel } from "@/components/dashboard/Panel";

type JournalEntry = { id: string; text: string; at: string; date: string };

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/journal?days=60");
    const data = await res.json();
    setEntries(data.entries ?? []);
  }

  async function submit() {
    if (!draft.trim()) return;
    await fetch("/api/journal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: draft }),
    });
    setDraft("");
    load();
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <Panel index="01" title="Journal — new entry">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Summarise your day…"
            className="w-full resize-none rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-ink-0 outline-none focus:border-accent"
          />
          <button
            onClick={submit}
            className="label-tracked mt-2 rounded-md border border-accent px-3 py-1.5 text-accent hover:bg-accent/10"
          >
            Save entry
          </button>
        </Panel>

        <div className="mt-4 space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border bg-panel-bg p-4">
              <p className="label-tracked mb-1">{new Date(entry.at).toLocaleString()}</p>
              <p className="whitespace-pre-wrap text-sm text-ink-0">{entry.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

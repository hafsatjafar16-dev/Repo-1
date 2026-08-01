"use client";

import { useState } from "react";

export function CaptureBox() {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/capture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setSubmitting(false);

    if (res.ok) {
      const data = await res.json();
      setToast(`Captured as ${data.classification.kind}`);
      setText("");
      setExpanded(false);
      setTimeout(() => setToast(null), 2500);
    } else {
      setToast("Capture failed — check the logs.");
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
      {toast && (
        <div className="mb-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-center text-sm text-ink-0 shadow-lg">
          {toast}
        </div>
      )}
      <div className="rounded-xl border border-border bg-panel-bg p-2 shadow-lg backdrop-blur">
        {expanded ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
                if (e.key === "Escape") setExpanded(false);
              }}
              placeholder="Capture a task, note, or thought…"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink-0 outline-none focus:border-accent"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExpanded(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-ink-2 hover:text-ink-0"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg hover:bg-accent-strong"
              >
                {submitting ? "Saving…" : "Capture"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-2 hover:text-ink-0"
          >
            + Capture something…
          </button>
        )}
      </div>
    </div>
  );
}

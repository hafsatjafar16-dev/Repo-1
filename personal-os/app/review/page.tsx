"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { weekStartKey } from "@/lib/weekStart";

type ReviewData = {
  wins: string;
  slipped: string;
  openLoops: string;
  followUps: string;
  topThree: string;
  sealed: boolean;
};

const EMPTY: ReviewData = { wins: "", slipped: "", openLoops: "", followUps: "", topThree: "", sealed: false };

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function Field({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-panel-bg p-3">
      <p className="label-tracked mb-2">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        rows={2}
        className="w-full resize-none rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-ink-0 outline-none focus:border-accent"
      />
    </div>
  );
}

export default function ReviewPage() {
  const week = weekStartKey();
  const weekStart = new Date(`${week}T00:00:00`);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const [review, setReview] = useState<ReviewData>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/review?week=${week}`)
      .then((res) => res.json())
      .then((data: { review: ReviewData }) => setReview(data.review ?? EMPTY));
  }, [week]);

  async function save(next: ReviewData) {
    setSaving(true);
    await fetch("/api/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ week, review: next }),
    });
    setSaving(false);
  }

  function update(field: keyof ReviewData, value: string) {
    setReview((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSeal() {
    const next = { ...review, sealed: !review.sealed };
    setReview(next);
    save(next);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-panel-bg p-4">
          <div>
            <p className="label-tracked">Weekly Review · W{weekNumber(weekStart)}</p>
            <p className="font-headline mt-1 text-xl text-ink-0">
              {weekStart.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              {" → "}
              {weekEnd.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="label-tracked text-ink-3">{saving ? "Saving…" : "Auto-saved"}</span>
            <button
              onClick={toggleSeal}
              className={`label-tracked rounded-md border px-3 py-1.5 ${
                review.sealed ? "border-ok/40 bg-ok/10 text-ok" : "border-border text-ink-1"
              }`}
            >
              {review.sealed ? "✓ Sealed" : "Seal week"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Wins this week" value={review.wins} onChange={(v) => update("wins", v)} onBlur={() => save(review)} />
          <Field label="What slipped" value={review.slipped} onChange={(v) => update("slipped", v)} onBlur={() => save(review)} />
          <Field label="Open loops" value={review.openLoops} onChange={(v) => update("openLoops", v)} onBlur={() => save(review)} />
          <Field
            label="People to follow up with"
            value={review.followUps}
            onChange={(v) => update("followUps", v)}
            onBlur={() => save(review)}
          />
        </div>

        <div className="rounded-lg border border-border bg-panel-bg p-3">
          <p className="label-tracked mb-2">Next week — top 3</p>
          <textarea
            value={review.topThree}
            onChange={(e) => update("topThree", e.target.value)}
            onBlur={() => save(review)}
            rows={2}
            placeholder="1) … 2) … 3) …"
            className="w-full resize-none rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-ink-0 outline-none focus:border-accent"
          />
        </div>
      </div>
    </Shell>
  );
}

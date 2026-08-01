"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import type { GoalItem } from "@/lib/types";

function GoalList({
  title,
  scope,
  items,
  onChange,
}: {
  title: string;
  scope: "week" | "month";
  items: GoalItem[];
  onChange: (scope: "week" | "month", items: GoalItem[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function toggle(id: string) {
    onChange(scope, items.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));
  }

  function remove(id: string) {
    onChange(scope, items.filter((g) => g.id !== id));
  }

  function add() {
    if (!draft.trim()) return;
    onChange(scope, [...items, { id: crypto.randomUUID(), text: draft.trim(), done: false }]);
    setDraft("");
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-2">{title}</p>
      <ul className="mb-2 space-y-1">
        {items.map((g) => (
          <li key={g.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={g.done} onChange={() => toggle(g.id)} />
            <span className={g.done ? "text-ink-3 line-through" : "text-ink-0"}>{g.text}</span>
            <button onClick={() => remove(g.id)} className="ml-auto text-xs text-ink-3 hover:text-danger">
              remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a goal"
          className="flex-1 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-ink-0 outline-none focus:border-accent"
        />
        <button onClick={add} className="rounded-lg border border-border px-2 py-1 text-xs text-ink-1">
          Add
        </button>
      </div>
    </div>
  );
}

export function GoalsCard() {
  const [week, setWeek] = useState<GoalItem[]>([]);
  const [month, setMonth] = useState<GoalItem[]>([]);

  useEffect(() => {
    fetch("/api/goals")
      .then((res) => res.json())
      .then((data: { week: GoalItem[]; month: GoalItem[] }) => {
        setWeek(data.week ?? []);
        setMonth(data.month ?? []);
      });
  }, []);

  async function handleChange(scope: "week" | "month", items: GoalItem[]) {
    if (scope === "week") setWeek(items);
    else setMonth(items);

    await fetch("/api/goals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, items }),
    });
  }

  return (
    <Panel title="Goals">
      <div className="space-y-4">
        <GoalList title="This Week" scope="week" items={week} onChange={handleChange} />
        <GoalList title="This Month" scope="month" items={month} onChange={handleChange} />
      </div>
    </Panel>
  );
}

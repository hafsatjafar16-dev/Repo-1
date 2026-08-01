"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import { localDateKey } from "@/lib/localDate";

const DEFAULT_HABITS = ["Move", "Deep work block", "Inbox zero", "Read", "No screens after 10pm", "Plan tomorrow"];

export function HabitTrackerCard() {
  const today = localDateKey();
  const storageKey = `os-habits-${today}`;
  const [done, setDone] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const cached = window.localStorage.getItem(storageKey);
    return cached ? JSON.parse(cached) : [];
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/habits?days=30`)
      .then((res) => res.json())
      .then((data: { days: { date: string; done: string[] }[] }) => {
        const todayEntry = data.days?.find((d) => d.date === today);
        if (todayEntry) {
          setDone(todayEntry.done);
          localStorage.setItem(storageKey, JSON.stringify(todayEntry.done));
        }
      })
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(habit: string) {
    const next = done.includes(habit) ? done.filter((h) => h !== habit) : [...done, habit];
    setDone(next);
    localStorage.setItem(storageKey, JSON.stringify(next));

    await fetch(`/api/habits/${today}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: next, total: DEFAULT_HABITS.length }),
    });
  }

  return (
    <Panel title="Habit Tracker">
      <ul className="space-y-2">
        {DEFAULT_HABITS.map((habit) => (
          <li key={habit}>
            <button
              onClick={() => toggle(habit)}
              disabled={!loaded}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                done.includes(habit)
                  ? "border-ok/40 bg-ok/10 text-ink-0"
                  : "border-border text-ink-2 hover:text-ink-0"
              }`}
            >
              <span
                className={`h-4 w-4 shrink-0 rounded border ${
                  done.includes(habit) ? "border-ok bg-ok" : "border-border"
                }`}
              />
              {habit}
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

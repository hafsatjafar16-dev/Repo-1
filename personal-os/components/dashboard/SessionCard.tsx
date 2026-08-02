"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "./Panel";
import { operatorConfig } from "@/lib/operatorConfig";
import type { Task } from "@/lib/types";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function SessionCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/tasks?status=open")
      .then((res) => res.json())
      .then((data: { tasks: Task[] }) => {
        const top = (data.tasks ?? [])
          .filter((t) => t.urgency === "today" && t.key)
          .sort((a, b) => b.priority_score - a.priority_score)
          .slice(0, 3);
        setTasks(top);
      })
      .finally(() => setLoading(false));

    Promise.resolve().then(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const firstName = operatorConfig.name.split(/\s+/)[0];

  return (
    <Panel index="02" title="Session" action={<Link href="/crm" className="label-tracked text-accent hover:underline">Open CRM →</Link>}>
      <div className="mb-4 flex items-end justify-between">
        <p className="font-headline text-2xl text-ink-0">
          {now ? greeting(now.getHours()) : "Hello"}, {firstName}.
        </p>
        {now && (
          <p className="font-tabular text-right text-2xl text-ink-0">
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            <span className="ml-2 block label-tracked text-right">Local time</span>
          </p>
        )}
      </div>

      <p className="label-tracked mb-2">Key tasks today</p>
      {loading && <p className="text-sm text-ink-2">Loading…</p>}
      {!loading && tasks.length === 0 && (
        <p className="text-sm text-ink-2">No key tasks marked for today.</p>
      )}
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-md border border-border p-2">
            <span className="text-sm text-ink-0">{t.title}</span>
            {t.time_estimate_min && (
              <span className="font-tabular text-xs text-ink-2">{t.time_estimate_min}m</span>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

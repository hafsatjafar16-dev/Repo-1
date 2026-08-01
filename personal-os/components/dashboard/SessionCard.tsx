"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "./Panel";
import type { Task } from "@/lib/types";

export function SessionCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  return (
    <Panel title="Session" action={<Link href="/crm" className="text-xs text-accent hover:underline">Open CRM →</Link>}>
      {loading && <p className="text-sm text-ink-2">Loading…</p>}
      {!loading && tasks.length === 0 && (
        <p className="text-sm text-ink-2">No key tasks marked for today.</p>
      )}
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-lg border border-border p-2">
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

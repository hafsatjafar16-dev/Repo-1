"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import type { Entity, Task } from "@/lib/types";

export function PracticePulseCard() {
  const [openTasks, setOpenTasks] = useState<number | null>(null);
  const [overdue, setOverdue] = useState<number | null>(null);
  const [clients, setClients] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/tasks?status=open")
      .then((res) => res.json())
      .then((data: { tasks: Task[] }) => {
        const tasks = data.tasks ?? [];
        const today = new Date().toISOString().slice(0, 10);
        setOpenTasks(tasks.length);
        setOverdue(tasks.filter((t) => t.due_date && t.due_date < today).length);
      });

    fetch("/api/entities")
      .then((res) => res.json())
      .then((data: { entities: Entity[] }) => {
        setClients((data.entities ?? []).filter((e) => e.kind === "client").length);
      });
  }, []);

  return (
    <Panel index="04" title="Practice Pulse">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border p-3">
          <p className="label-tracked">Open tasks</p>
          <p className="font-tabular mt-1 text-2xl text-ink-0">{openTasks ?? "—"}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="label-tracked">Overdue</p>
          <p className={`font-tabular mt-1 text-2xl ${overdue ? "text-danger" : "text-ink-0"}`}>
            {overdue ?? "—"}
          </p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="label-tracked">Clients</p>
          <p className="font-tabular mt-1 text-2xl text-ink-0">{clients ?? "—"}</p>
        </div>
      </div>
    </Panel>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Panel } from "@/components/dashboard/Panel";
import type { Entity, Task, Urgency } from "@/lib/types";

const URGENCY_TIERS: { value: Urgency; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "someday", label: "Someday" },
];

type View = "kanban" | "smart" | "category";

export default function CrmPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "kanban";
    return (window.localStorage.getItem("os-crm-view") as View | null) ?? "kanban";
  });
  const [selected, setSelected] = useState<Task | null>(null);
  const [smartQuery, setSmartQuery] = useState("");
  const [smartIds, setSmartIds] = useState<string[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newEntityName, setNewEntityName] = useState("");

  async function loadTasks() {
    const res = await fetch("/api/tasks?status=open");
    const data = await res.json();
    setTasks(data.tasks ?? []);
  }

  async function loadEntities() {
    const res = await fetch("/api/entities");
    const data = await res.json();
    setEntities(data.entities ?? []);
  }

  useEffect(() => {
    // loadTasks/loadEntities await a fetch before calling setState, so this
    // isn't actually synchronous — the lint rule can't see across the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
    loadEntities();
  }, []);

  useEffect(() => {
    localStorage.setItem("os-crm-view", view);
  }, [view]);

  async function createTask() {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: newTitle, urgency: "this_week" }),
    });
    const data = await res.json();
    setTasks((prev) => [data.task, ...prev]);
    setNewTitle("");
  }

  async function createEntity() {
    if (!newEntityName.trim()) return;
    const res = await fetch("/api/entities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newEntityName, kind: "client" }),
    });
    const data = await res.json();
    setEntities((prev) => [data.entity, ...prev]);
    setNewEntityName("");
  }

  async function updateTask(id: string, patch: Partial<Task> & { completed?: boolean }) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (patch.completed) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSelected(null);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      setSelected((prev) => (prev?.id === id ? data.task : prev));
    }
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelected(null);
  }

  async function runSmartSearch() {
    if (!smartQuery.trim()) {
      setSmartIds(null);
      return;
    }
    const res = await fetch("/api/tasks/smart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: smartQuery }),
    });
    const data = await res.json();
    setSmartIds(data.ids ?? []);
  }

  function onDrop(urgency: Urgency, e: React.DragEvent) {
    const id = e.dataTransfer.getData("text/task-id");
    if (!id) return;
    const topScore = tasks.reduce((max, t) => Math.max(max, t.priority_score), 0);
    updateTask(id, { urgency, priority_score: topScore + 1 });
  }

  const entityById = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = task.entity_id ?? "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const smartTasks = smartIds ? tasks.filter((t) => smartIds.includes(t.id)) : [];

  return (
    <Shell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-bg-elevated p-1">
          {(["kanban", "smart", "category"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize transition ${
                view === v ? "bg-accent text-bg font-medium" : "text-ink-2 hover:text-ink-0"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTask()}
            placeholder="New task title…"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm text-ink-0 outline-none focus:border-accent"
          />
          <button onClick={createTask} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-bg">
            Add task
          </button>
          <input
            value={newEntityName}
            onChange={(e) => setNewEntityName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createEntity()}
            placeholder="New client name…"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm text-ink-0 outline-none focus:border-accent"
          />
          <button onClick={createEntity} className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink-1">
            Add client
          </button>
        </div>
      </div>

      {view === "kanban" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {URGENCY_TIERS.map((tier) => (
            <div
              key={tier.value}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(tier.value, e)}
              className="rounded-xl border border-border bg-panel-bg p-3 backdrop-blur"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-2">{tier.label}</p>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.urgency === tier.value)
                  .sort((a, b) => b.priority_score - a.priority_score)
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      entityName={task.entity_id ? entityById.get(task.entity_id)?.name : undefined}
                      onClick={() => setSelected(task)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "smart" && (
        <Panel title="Smart search">
          <div className="mb-3 flex gap-2">
            <input
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSmartSearch()}
              placeholder="what should I do this morning?"
              className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-ink-0 outline-none focus:border-accent"
            />
            <button onClick={runSmartSearch} className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">
              Search
            </button>
          </div>
          {smartIds !== null && smartTasks.length === 0 && (
            <p className="text-sm text-ink-2">No matching tasks.</p>
          )}
          <div className="space-y-2">
            {smartTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                entityName={task.entity_id ? entityById.get(task.entity_id)?.name : undefined}
                onClick={() => setSelected(task)}
              />
            ))}
          </div>
        </Panel>
      )}

      {view === "category" && (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([entityId, groupTasks]) => (
            <Panel key={entityId} title={entityId === "__none__" ? "No client" : entityById.get(entityId)?.name ?? "Unknown"}>
              <div className="space-y-2">
                {groupTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelected(task)} />
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {selected && (
        <TaskDrawer
          task={selected}
          entities={entities}
          onClose={() => setSelected(null)}
          onUpdate={(patch) => updateTask(selected.id, patch)}
          onDelete={() => deleteTask(selected.id)}
        />
      )}
    </Shell>
  );
}

function TaskCard({
  task,
  entityName,
  onClick,
}: {
  task: Task;
  entityName?: string;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-border bg-bg-elevated p-3 text-sm hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-ink-0">{task.title}</p>
        {task.key && <span className="shrink-0 rounded bg-warn/20 px-1.5 py-0.5 text-[10px] text-warn">KEY</span>}
      </div>
      {entityName && <p className="mt-1 text-xs text-ink-2">{entityName}</p>}
      {task.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag} className="rounded bg-bg px-1.5 py-0.5 text-[10px] text-ink-2">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskDrawer({
  task,
  entities,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: Task;
  entities: Entity[];
  onClose: () => void;
  onUpdate: (patch: Partial<Task> & { completed?: boolean }) => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-sm overflow-y-auto border-l border-border bg-bg p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-0">Edit task</h3>
          <button onClick={onClose} className="text-ink-2 hover:text-ink-0">
            ✕
          </button>
        </div>

        <label className="mb-3 block text-xs text-ink-2">
          Title
          <input
            defaultValue={task.title}
            onBlur={(e) => onUpdate({ title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-sm text-ink-0"
          />
        </label>

        <label className="mb-3 block text-xs text-ink-2">
          Description
          <textarea
            defaultValue={task.description ?? ""}
            onBlur={(e) => onUpdate({ description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-sm text-ink-0"
          />
        </label>

        <label className="mb-3 block text-xs text-ink-2">
          Urgency
          <select
            defaultValue={task.urgency}
            onChange={(e) => onUpdate({ urgency: e.target.value as Task["urgency"] })}
            className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-sm text-ink-0"
          >
            {URGENCY_TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-3 block text-xs text-ink-2">
          Client
          <select
            defaultValue={task.entity_id ?? ""}
            onChange={(e) => onUpdate({ entity_id: e.target.value || null })}
            className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-sm text-ink-0"
          >
            <option value="">— none —</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-3 flex items-center gap-2 text-xs text-ink-2">
          <input
            type="checkbox"
            defaultChecked={task.key}
            onChange={(e) => onUpdate({ key: e.target.checked })}
          />
          Key task
        </label>

        <label className="mb-4 block text-xs text-ink-2">
          Time estimate (min)
          <input
            type="number"
            defaultValue={task.time_estimate_min ?? ""}
            onBlur={(e) => onUpdate({ time_estimate_min: e.target.value ? Number(e.target.value) : null })}
            className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-sm text-ink-0"
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ completed: true })}
            className="flex-1 rounded-lg bg-ok/20 px-3 py-2 text-sm text-ok"
          >
            Mark done
          </button>
          <button onClick={onDelete} className="flex-1 rounded-lg bg-danger/20 px-3 py-2 text-sm text-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

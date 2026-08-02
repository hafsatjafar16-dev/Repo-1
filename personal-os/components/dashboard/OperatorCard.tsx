"use client";

import { useEffect, useState } from "react";
import { Panel } from "./Panel";
import { operatorConfig } from "@/lib/operatorConfig";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function OperatorCard() {
  const [clientCount, setClientCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/entities")
      .then((res) => res.json())
      .then((data: { entities: { kind: string }[] }) => {
        setClientCount((data.entities ?? []).filter((e) => e.kind === "client").length);
      });
  }, []);

  return (
    <Panel
      index="01"
      title="Operator"
      action={
        <span className="label-tracked flex items-center gap-1.5 text-ok">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          Online
        </span>
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded border border-border font-tabular text-sm text-ink-1">
          {initials(operatorConfig.name) || "—"}
        </div>
        <div>
          <p className="text-base text-ink-0">{operatorConfig.name}</p>
          <p className="label-tracked">
            {operatorConfig.role} · {operatorConfig.location}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border p-3">
          <p className="label-tracked">Focus</p>
          <p className="font-headline mt-1 text-sm text-ink-0">{operatorConfig.currentFocus}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="label-tracked">Clients</p>
          <p className="font-tabular mt-1 text-lg text-ink-0">{clientCount ?? "—"}</p>
        </div>
      </div>
    </Panel>
  );
}

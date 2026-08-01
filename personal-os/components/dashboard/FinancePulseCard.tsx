"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "./Panel";
import type { FinanceSnapshot } from "@/lib/types";

export function FinancePulseCard() {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reads the latest saved snapshot only — never triggers the AI pipeline on load.
    fetch("/api/finance")
      .then((res) => res.json())
      .then((data: { snapshot: FinanceSnapshot | null }) => setSnapshot(data.snapshot))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Panel title="Finance Pulse" action={<Link href="/finance" className="text-xs text-accent hover:underline">Details →</Link>}>
      {loading && <p className="text-sm text-ink-2">Loading…</p>}
      {!loading && !snapshot && (
        <p className="text-sm text-ink-2">No snapshot yet — configure Google Sheets and refresh from the Finance tab.</p>
      )}
      {snapshot && (
        <div>
          <p className="font-tabular text-2xl text-ink-0">
            {snapshot.net_worth.toLocaleString(undefined, { style: "currency", currency: snapshot.currency })}
          </p>
          <p className="text-xs text-ink-2">as of {snapshot.as_of}</p>
        </div>
      )}
    </Panel>
  );
}

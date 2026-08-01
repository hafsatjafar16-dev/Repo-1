"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Panel } from "@/components/dashboard/Panel";
import type { FinanceSnapshot } from "@/lib/types";

export default function FinancePage() {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/finance");
    const data = await res.json();
    setSnapshot(data.snapshot);
    setLoading(false);
  }

  useEffect(() => {
    // load() awaits a fetch before calling setState, so this isn't actually
    // synchronous — the lint rule can't see across the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    const res = await fetch("/api/finance/snapshot", { method: "POST" });
    if (!res.ok) {
      setError("Refresh failed — check Google Sheets env vars are configured.");
    } else {
      const data = await res.json();
      setSnapshot(data.snapshot);
    }
    setRefreshing(false);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <Panel
          title="Finance Pulse"
          action={
            <button
              onClick={refresh}
              disabled={refreshing}
              className="rounded-lg border border-border px-3 py-1 text-xs text-ink-1 hover:text-ink-0"
            >
              {refreshing ? "Refreshing…" : "Refresh now"}
            </button>
          }
        >
          {loading && <p className="text-sm text-ink-2">Loading…</p>}
          {error && <p className="mb-3 text-sm text-danger">{error}</p>}
          {!loading && !snapshot && (
            <p className="text-sm text-ink-2">
              No snapshot yet. Configure GOOGLE_SHEETS_FINANCE_ID and the service account env vars,
              then click Refresh. Page loads never trigger the AI pipeline automatically — only this
              button or the daily cron does.
            </p>
          )}
          {snapshot && (
            <div>
              <p className="font-tabular text-3xl text-ink-0">
                {snapshot.net_worth.toLocaleString(undefined, { style: "currency", currency: snapshot.currency })}
              </p>
              <p className="mb-4 text-xs text-ink-2">as of {snapshot.as_of}</p>
              <ul className="space-y-1">
                {snapshot.categories.map((cat) => (
                  <li key={cat.name} className="flex justify-between text-sm">
                    <span className="text-ink-1">{cat.name}</span>
                    <span className="font-tabular text-ink-0">
                      {cat.value.toLocaleString(undefined, { style: "currency", currency: snapshot.currency })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>
    </Shell>
  );
}

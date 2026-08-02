"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/crm", label: "CRM" },
  { href: "/brain", label: "Brain" },
  { href: "/journal", label: "Journal" },
];

export function TopRail() {
  const pathname = usePathname();
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Deferred to a microtask so the initial clock render doesn't set state
    // synchronously inside the effect body (avoids a hydration mismatch too,
    // since the server has no "now").
    Promise.resolve().then(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <div className="text-sm font-semibold tracking-wide text-ink-0">
        Personal OS
      </div>

      <nav className="flex gap-1 rounded-lg border border-border bg-bg-elevated p-1">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                active
                  ? "bg-accent text-bg font-medium"
                  : "text-ink-2 hover:text-ink-0"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 font-tabular text-sm text-ink-2">
        {now && (
          <span>
            {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            {" · "}
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="rounded-md border border-border px-2 py-1 text-xs text-ink-2 hover:text-ink-0"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

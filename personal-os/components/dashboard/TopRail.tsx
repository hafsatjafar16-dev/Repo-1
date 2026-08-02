"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { operatorConfig } from "@/lib/operatorConfig";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/crm", label: "CRM" },
  { href: "/brain", label: "Brain" },
  { href: "/journal", label: "Journal" },
  { href: "/review", label: "Review" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" />
        <span className="label-tracked text-ink-1">Personal OS // v1</span>
      </div>

      <nav className="flex gap-1">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`label-tracked rounded-md border px-3 py-1.5 transition ${
                active
                  ? "border-border text-ink-0"
                  : "border-transparent text-ink-3 hover:text-ink-1"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        {now && (
          <span className="font-tabular label-tracked text-ink-2">
            {now
              .toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
              .toUpperCase()}
            {"  "}
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="label-tracked rounded-md border border-border px-2 py-1 text-ink-2 hover:text-ink-0"
        >
          Log out
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded border border-border font-tabular text-xs text-ink-1">
          {initials(operatorConfig.name) || "—"}
        </div>
      </div>
    </header>
  );
}

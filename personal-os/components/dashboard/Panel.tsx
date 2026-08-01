import type { ReactNode } from "react";

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-panel-bg backdrop-blur ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold tracking-wide text-ink-2 uppercase">
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

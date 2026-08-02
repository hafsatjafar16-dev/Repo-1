import type { ReactNode } from "react";

export function Panel({
  title,
  index,
  action,
  children,
  className = "",
}: {
  title?: string;
  index?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-border bg-panel-bg ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="label-tracked">
            {index && <span className="text-ink-3">{index}{" // "}</span>}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

import { Panel } from "./Panel";
import { operatorConfig } from "@/lib/operatorConfig";

export function OperatorCard() {
  return (
    <Panel title="Operator">
      <p className="text-lg font-semibold text-ink-0">{operatorConfig.name}</p>
      <p className="text-sm text-ink-2">{operatorConfig.role}</p>
      <p className="text-sm text-ink-2">{operatorConfig.location}</p>
      <div className="mt-3 rounded-lg border border-border bg-bg-elevated p-3">
        <p className="text-xs uppercase tracking-wide text-ink-2">Current focus</p>
        <p className="mt-1 text-sm text-ink-0">{operatorConfig.currentFocus}</p>
      </div>
    </Panel>
  );
}

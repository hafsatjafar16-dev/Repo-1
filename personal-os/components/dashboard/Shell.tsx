import type { ReactNode } from "react";
import { TopRail } from "./TopRail";
import { CaptureBox } from "./CaptureBox";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg pb-24">
      <TopRail />
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      <CaptureBox />
    </div>
  );
}

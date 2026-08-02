import { Shell } from "@/components/dashboard/Shell";
import { OperatorCard } from "@/components/dashboard/OperatorCard";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { PracticePulseCard } from "@/components/dashboard/PracticePulseCard";

export default function Home() {
  return (
    <Shell>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-4">
          <OperatorCard />
          <PracticePulseCard />
          <GoalsCard />
        </div>

        <div className="space-y-4">
          <SessionCard />
        </div>
      </div>
    </Shell>
  );
}

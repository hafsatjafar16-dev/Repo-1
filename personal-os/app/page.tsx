import { Shell } from "@/components/dashboard/Shell";
import { OperatorCard } from "@/components/dashboard/OperatorCard";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { HabitTrackerCard } from "@/components/dashboard/HabitTrackerCard";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { FinancePulseCard } from "@/components/dashboard/FinancePulseCard";
import { CalendarStrip } from "@/components/dashboard/CalendarStrip";

export default function Home() {
  return (
    <Shell>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr_1fr]">
        <div className="space-y-4">
          <OperatorCard />
          <FinancePulseCard />
          <CalendarStrip />
        </div>

        <div className="space-y-4">
          <SessionCard />
          <HabitTrackerCard />
          <GoalsCard />
        </div>

        <div className="space-y-4">
          <NutritionCard />
        </div>
      </div>
    </Shell>
  );
}

"use client";

import { Fragment, useEffect, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Panel } from "@/components/dashboard/Panel";
import type { NutritionMeal } from "@/lib/types";

type DayRow = {
  date: string;
  meals: NutritionMeal[];
  totals: { kcal: number; p: number; c: number; f: number };
};

export default function HealthPage() {
  const [days, setDays] = useState<DayRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/nutrition?days=30")
      .then((res) => res.json())
      .then((data: { days: DayRow[] }) => setDays(data.days ?? []));
  }, []);

  const loggedDays = days.filter((d) => d.meals.length > 0);
  const averages = loggedDays.reduce(
    (acc, d) => ({
      kcal: acc.kcal + d.totals.kcal / loggedDays.length,
      p: acc.p + d.totals.p / loggedDays.length,
      c: acc.c + d.totals.c / loggedDays.length,
      f: acc.f + d.totals.f / loggedDays.length,
    }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  return (
    <Shell>
      <Panel title={`Health — last 30 days (avg over ${loggedDays.length} logged days)`}>
        {loggedDays.length > 0 && (
          <p className="mb-4 font-tabular text-sm text-ink-2">
            Avg: {Math.round(averages.kcal)} kcal · P {Math.round(averages.p)} · C {Math.round(averages.c)} · F{" "}
            {Math.round(averages.f)}
          </p>
        )}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-2">
              <th className="pb-2">Date</th>
              <th className="pb-2 font-tabular">KCAL</th>
              <th className="pb-2 font-tabular">P</th>
              <th className="pb-2 font-tabular">C</th>
              <th className="pb-2 font-tabular">F</th>
              <th className="pb-2 font-tabular">Meals</th>
            </tr>
          </thead>
          <tbody>
            {loggedDays.map((day) => (
              <Fragment key={day.date}>
                <tr
                  onClick={() => setExpanded(expanded === day.date ? null : day.date)}
                  className="cursor-pointer border-t border-border hover:bg-bg-elevated"
                >
                  <td className="py-2 text-ink-0">{day.date}</td>
                  <td className="py-2 font-tabular text-ink-0">{Math.round(day.totals.kcal)}</td>
                  <td className="py-2 font-tabular text-ink-2">{Math.round(day.totals.p)}</td>
                  <td className="py-2 font-tabular text-ink-2">{Math.round(day.totals.c)}</td>
                  <td className="py-2 font-tabular text-ink-2">{Math.round(day.totals.f)}</td>
                  <td className="py-2 font-tabular text-ink-2">{day.meals.length}</td>
                </tr>
                {expanded === day.date && (
                  <tr className="border-t border-border bg-bg-elevated">
                    <td colSpan={6} className="p-3">
                      <ul className="space-y-1">
                        {day.meals.map((meal) => (
                          <li key={meal.id} className="flex justify-between text-xs text-ink-2">
                            <span>
                              {meal.t} · {meal.n}
                            </span>
                            <span className="font-tabular">
                              {Math.round(meal.kcal)} kcal (P{Math.round(meal.p)} C{Math.round(meal.c)} F
                              {Math.round(meal.f)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {loggedDays.length === 0 && <p className="text-sm text-ink-2">No logged days yet.</p>}
      </Panel>
    </Shell>
  );
}

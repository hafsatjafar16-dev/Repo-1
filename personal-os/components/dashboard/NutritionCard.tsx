"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "./Panel";
import { localDateKey } from "@/lib/localDate";
import type { NutritionMeal } from "@/lib/types";

export function NutritionCard() {
  const today = localDateKey();
  const [meals, setMeals] = useState<NutritionMeal[]>([]);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/nutrition?days=1`)
      .then((res) => res.json())
      .then((data: { days: { date: string; meals: NutritionMeal[] }[] }) => {
        const todayEntry = data.days?.find((d) => d.date === today);
        if (todayEntry) setMeals(todayEntry.meals);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveMeal(meal: NutritionMeal) {
    setMeals((prev) => {
      const next = prev.filter((m) => m.id !== meal.id);
      next.push(meal);
      return next;
    });
    await fetch("/api/nutrition", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: today, meal }),
    });
  }

  async function addMeal() {
    if (!draft.trim()) return;
    setAdding(true);
    const res = await fetch("/api/nutrition/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: draft }),
    });
    const macros = await res.json();
    await saveMeal({
      id: crypto.randomUUID(),
      t: new Date().toTimeString().slice(0, 5),
      n: draft.trim(),
      kcal: macros.kcal,
      p: macros.p,
      c: macros.c,
      f: macros.f,
      estimated: true,
    });
    setDraft("");
    setAdding(false);
  }

  function editMacro(meal: NutritionMeal, field: "p" | "c" | "f", value: number) {
    const updated = { ...meal, [field]: value };
    updated.kcal = 4 * updated.p + 4 * updated.c + 9 * updated.f;
    saveMeal(updated);
  }

  function editKcal(meal: NutritionMeal, kcal: number) {
    const updated = { ...meal, kcal };
    setMeals((prev) => prev.map((m) => (m.id === meal.id ? updated : m)));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch("/api/nutrition/redistribute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: meal.n, kcal }),
      });
      const macros = await res.json();
      saveMeal({ ...updated, ...macros });
    }, 600);
  }

  const totals = meals.reduce(
    (acc, m) => ({ kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  return (
    <Panel title="Nutrition">
      <div className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMeal()}
          placeholder="e.g. grilled chicken salad"
          className="flex-1 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-ink-0 outline-none focus:border-accent"
        />
        <button
          onClick={addMeal}
          disabled={adding}
          className="rounded-lg border border-border px-2 py-1 text-xs text-ink-1"
        >
          {adding ? "…" : "Add"}
        </button>
      </div>

      <ul className="space-y-2">
        {meals.map((meal) => (
          <li key={meal.id} className="rounded-lg border border-border p-2 text-sm">
            <div className="mb-1 flex justify-between">
              <span className="text-ink-0">{meal.n}</span>
              <span className="font-tabular text-ink-2">{meal.t}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 font-tabular text-xs text-ink-2">
              <label className="flex flex-col">
                kcal
                <input
                  type="number"
                  value={Math.round(meal.kcal)}
                  onChange={(e) => editKcal(meal, Number(e.target.value))}
                  className="w-full rounded border border-border bg-bg px-1 py-0.5 text-ink-0"
                />
              </label>
              <label className="flex flex-col">
                p
                <input
                  type="number"
                  value={Math.round(meal.p)}
                  onChange={(e) => editMacro(meal, "p", Number(e.target.value))}
                  className="w-full rounded border border-border bg-bg px-1 py-0.5 text-ink-0"
                />
              </label>
              <label className="flex flex-col">
                c
                <input
                  type="number"
                  value={Math.round(meal.c)}
                  onChange={(e) => editMacro(meal, "c", Number(e.target.value))}
                  className="w-full rounded border border-border bg-bg px-1 py-0.5 text-ink-0"
                />
              </label>
              <label className="flex flex-col">
                f
                <input
                  type="number"
                  value={Math.round(meal.f)}
                  onChange={(e) => editMacro(meal, "f", Number(e.target.value))}
                  className="w-full rounded border border-border bg-bg px-1 py-0.5 text-ink-0"
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      {meals.length > 0 && (
        <p className="mt-3 font-tabular text-xs text-ink-2">
          Total: {Math.round(totals.kcal)} kcal · P {Math.round(totals.p)} · C {Math.round(totals.c)} · F{" "}
          {Math.round(totals.f)}
        </p>
      )}
    </Panel>
  );
}

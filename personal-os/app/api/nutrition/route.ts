import { NextResponse } from "next/server";
import { getDailyLog, getDailyLogsRange, mergeDailyLogNotes } from "@/lib/dailyLogs";
import type { NutritionMeal } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30);

  const logs = await getDailyLogsRange(days);
  const rows = logs
    .filter((log) => log.notes?.nutrition)
    .map((log) => {
      const meals = ((log.notes.nutrition as { meals?: NutritionMeal[] })?.meals ?? []);
      return {
        date: log.log_date,
        meals,
        totals: meals.reduce(
          (acc, m) => ({
            kcal: acc.kcal + m.kcal,
            p: acc.p + m.p,
            c: acc.c + m.c,
            f: acc.f + m.f,
          }),
          { kcal: 0, p: 0, c: 0, f: 0 }
        ),
      };
    });

  return NextResponse.json({ days: rows });
}

/** Add or update a meal for today (or a given date). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const date = body?.date ?? new Date().toISOString().slice(0, 10);
  const meal: NutritionMeal | undefined = body?.meal;

  if (!meal?.id || !meal?.n) {
    return NextResponse.json({ error: "meal.id and meal.n are required" }, { status: 400 });
  }

  const existing = await getDailyLog(date);
  const meals = ((existing?.notes.nutrition as { meals?: NutritionMeal[] })?.meals ?? []).filter(
    (m) => m.id !== meal.id
  );
  meals.push(meal);

  const log = await mergeDailyLogNotes(date, { nutrition: { meals } });
  return NextResponse.json({ log });
}

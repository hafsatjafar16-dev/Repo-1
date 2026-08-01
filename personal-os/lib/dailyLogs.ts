import { supabaseAdmin, currentUserId } from "@/lib/supabase/server";

export const GOALS_SENTINEL_DATE = "2000-01-01";

type DailyLogNotes = Record<string, unknown>;

export async function getDailyLog(logDate: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("daily_logs")
    .select("*")
    .eq("user_id", currentUserId())
    .eq("log_date", logDate)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as { id: string; log_date: string; notes: DailyLogNotes; mood: number | null } | null;
}

export async function getDailyLogsRange(days: number) {
  const db = supabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await db
    .from("daily_logs")
    .select("*")
    .eq("user_id", currentUserId())
    .gte("log_date", since.toISOString().slice(0, 10))
    .order("log_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Shallow-merges `patch` into the notes JSON for a given day, upserting the row. */
export async function mergeDailyLogNotes(logDate: string, patch: DailyLogNotes) {
  const db = supabaseAdmin();
  const existing = await getDailyLog(logDate);
  const notes = { ...(existing?.notes ?? {}), ...patch };

  const { data, error } = await db
    .from("daily_logs")
    .upsert(
      {
        user_id: currentUserId(),
        log_date: logDate,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,log_date" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

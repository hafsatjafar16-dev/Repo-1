export type Urgency = "today" | "this_week" | "this_month" | "someday";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  urgency: Urgency;
  key: boolean;
  priority_score: number;
  time_estimate_min: number | null;
  tags: string[];
  due_date: string | null;
  owner: string | null;
  entity_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Entity = {
  id: string;
  name: string;
  kind: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type GoalItem = {
  id: string;
  text: string;
  done: boolean;
};

export type HabitDay = {
  date: string;
  done: string[];
  total: number;
};

export type NutritionMeal = {
  id: string;
  t: string; // time (HH:mm)
  n: string; // meal name
  kcal: number;
  p: number;
  c: number;
  f: number;
  estimated: boolean;
};

export type FinanceSnapshot = {
  net_worth: number;
  currency: string;
  as_of: string;
  categories: { name: string; value: number }[];
};

export type MemoryChunk = {
  id: string;
  source_type: string;
  source_id: string | null;
  text: string;
  created_at: string;
};

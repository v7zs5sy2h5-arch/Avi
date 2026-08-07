import type { SupabaseClient } from "@supabase/supabase-js";
import { FACIALS_CATEGORY } from "@/types/database";

type Cat = { category: string } | { category: string }[] | null;

function firstCategory(c: Cat): string | null {
  if (!c) return null;
  return Array.isArray(c) ? (c[0]?.category ?? null) : c.category;
}

export interface MonthlySummary {
  treatmentIncome: number;
  productIncome: number;
  totalIncome: number;
  totalExpenses: number;
  profit: number;
}

export async function getMonthlySummary(
  supabase: SupabaseClient,
  start: Date,
  end: Date,
): Promise<MonthlySummary> {
  const [{ data: logs }, { data: sales }, { data: expenses }] = await Promise.all([
    supabase
      .from("treatment_log")
      .select("amount")
      .eq("is_paid", true)
      .gte("performed_at", start.toISOString())
      .lt("performed_at", end.toISOString()),
    supabase
      .from("product_sales")
      .select("amount")
      .eq("is_paid", true)
      .gte("sold_at", start.toISOString())
      .lt("sold_at", end.toISOString()),
    supabase
      .from("expenses")
      .select("amount")
      .gte("spent_at", start.toISOString())
      .lt("spent_at", end.toISOString()),
  ]);

  const sum = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const treatmentIncome = sum(logs);
  const productIncome = sum(sales);
  const totalExpenses = sum(expenses);
  const totalIncome = treatmentIncome + productIncome;

  return {
    treatmentIncome,
    productIncome,
    totalIncome,
    totalExpenses,
    profit: totalIncome - totalExpenses,
  };
}

export interface CategoryStat {
  category: string;
  amount: number;
  minutes: number;
  perHour: number;
}

export async function getIncomePerHourByCategory(
  supabase: SupabaseClient,
  start?: Date,
  end?: Date,
): Promise<CategoryStat[]> {
  let query = supabase
    .from("treatment_log")
    .select("amount, duration_minutes, treatment:treatments(category)")
    .eq("is_paid", true);
  if (start) query = query.gte("performed_at", start.toISOString());
  if (end) query = query.lt("performed_at", end.toISOString());
  const { data } = await query;

  const map = new Map<string, { amount: number; minutes: number }>();
  for (const row of data ?? []) {
    const category = firstCategory(row.treatment) ?? "אחר";
    const entry = map.get(category) ?? { amount: 0, minutes: 0 };
    entry.amount += Number(row.amount);
    entry.minutes += Number(row.duration_minutes);
    map.set(category, entry);
  }

  return Array.from(map.entries())
    .map(([category, { amount, minutes }]) => ({
      category,
      amount,
      minutes,
      perHour: minutes > 0 ? amount / (minutes / 60) : 0,
    }))
    .sort((a, b) => b.perHour - a.perHour);
}

export interface TreatmentStat {
  name: string;
  amount: number;
  minutes: number;
  count: number;
  perHour: number;
}

export async function getIncomePerHourByTreatment(
  supabase: SupabaseClient,
  start?: Date,
  end?: Date,
): Promise<TreatmentStat[]> {
  let query = supabase
    .from("treatment_log")
    .select("amount, duration_minutes, treatment_name")
    .eq("is_paid", true);
  if (start) query = query.gte("performed_at", start.toISOString());
  if (end) query = query.lt("performed_at", end.toISOString());
  const { data } = await query;

  const map = new Map<string, { amount: number; minutes: number; count: number }>();
  for (const row of data ?? []) {
    const name = row.treatment_name;
    const entry = map.get(name) ?? { amount: 0, minutes: 0, count: 0 };
    entry.amount += Number(row.amount);
    entry.minutes += Number(row.duration_minutes);
    entry.count += 1;
    map.set(name, entry);
  }

  return Array.from(map.entries())
    .map(([name, { amount, minutes, count }]) => ({
      name,
      amount,
      minutes,
      count,
      perHour: minutes > 0 ? amount / (minutes / 60) : 0,
    }))
    .sort((a, b) => b.perHour - a.perHour);
}

export async function getWeeklyPlannedMinutes(
  supabase: SupabaseClient,
  start: Date,
  end: Date,
): Promise<number> {
  const { data } = await supabase
    .from("appointments")
    .select("duration_minutes")
    .in("status", ["planned", "completed"])
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString());

  return (data ?? []).reduce((s, r) => s + Number(r.duration_minutes), 0);
}

export interface FacialsProgress {
  completedCount: number;
  completedRevenue: number;
  plannedCount: number;
}

export async function getFacialsWeekProgress(
  supabase: SupabaseClient,
  start: Date,
  end: Date,
): Promise<FacialsProgress> {
  const [{ data: logs }, { data: planned }] = await Promise.all([
    supabase
      .from("treatment_log")
      .select("amount, treatment:treatments(category)")
      .gte("performed_at", start.toISOString())
      .lt("performed_at", end.toISOString()),
    supabase
      .from("appointments")
      .select("id, treatment:treatments(category)")
      .eq("status", "planned")
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString()),
  ]);

  const facialsLogs = (logs ?? []).filter(
    (l) => firstCategory(l.treatment) === FACIALS_CATEGORY,
  );
  const plannedFacials = (planned ?? []).filter(
    (p) => firstCategory(p.treatment) === FACIALS_CATEGORY,
  );

  return {
    completedCount: facialsLogs.length,
    completedRevenue: facialsLogs.reduce((s, l) => s + Number(l.amount), 0),
    plannedCount: plannedFacials.length,
  };
}

export interface FacialsWeekComparison {
  thisWeekCount: number;
  thisWeekRevenue: number;
  lastWeekCount: number;
  lastWeekRevenue: number;
  autoTargetCount: number;
  autoTargetRevenue: number;
}

export async function getFacialsWeekComparison(
  supabase: SupabaseClient,
  thisWeekStart: Date,
  thisWeekEnd: Date,
  lastWeekStart: Date,
  lastWeekEnd: Date,
): Promise<FacialsWeekComparison> {
  const [thisWeek, lastWeek] = await Promise.all([
    getFacialsWeekProgress(supabase, thisWeekStart, thisWeekEnd),
    getFacialsWeekProgress(supabase, lastWeekStart, lastWeekEnd),
  ]);

  return {
    thisWeekCount: thisWeek.completedCount,
    thisWeekRevenue: thisWeek.completedRevenue,
    lastWeekCount: lastWeek.completedCount,
    lastWeekRevenue: lastWeek.completedRevenue,
    autoTargetCount: Math.max(1, Math.ceil(lastWeek.completedCount * 1.1)),
    autoTargetRevenue: Math.max(1, Math.ceil(lastWeek.completedRevenue * 1.1)),
  };
}

export interface FacialsTreatmentUsage {
  id: string;
  name: string;
  count: number;
}

export async function getFacialsTreatmentUsage(
  supabase: SupabaseClient,
  start: Date,
  end: Date,
): Promise<FacialsTreatmentUsage[]> {
  const [{ data: treatments }, { data: logs }] = await Promise.all([
    supabase
      .from("treatments")
      .select("id, name, sort_order")
      .eq("category", FACIALS_CATEGORY)
      .order("sort_order"),
    supabase
      .from("treatment_log")
      .select("treatment_id")
      .gte("performed_at", start.toISOString())
      .lt("performed_at", end.toISOString()),
  ]);

  const counts = new Map<string, number>();
  for (const log of logs ?? []) {
    if (!log.treatment_id) continue;
    counts.set(log.treatment_id, (counts.get(log.treatment_id) ?? 0) + 1);
  }

  return (treatments ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    count: counts.get(t.id as string) ?? 0,
  }));
}

export interface FollowUpRate {
  rate: number;
  completedCount: number;
  followUpCount: number;
}

export async function getFollowUpRate(
  supabase: SupabaseClient,
  start: Date,
  end: Date,
): Promise<FollowUpRate> {
  const { data: completed } = await supabase
    .from("appointments")
    .select("id")
    .eq("status", "completed")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString());

  const ids = (completed ?? []).map((c) => c.id as string);
  if (ids.length === 0) return { rate: 0, completedCount: 0, followUpCount: 0 };

  const { data: followUps } = await supabase
    .from("appointments")
    .select("follow_up_of_appointment_id")
    .in("follow_up_of_appointment_id", ids);

  const distinct = new Set((followUps ?? []).map((f) => f.follow_up_of_appointment_id));

  return { rate: distinct.size / ids.length, completedCount: ids.length, followUpCount: distinct.size };
}

export interface WeeklyHoursPoint {
  label: string;
  hours: number;
  weekStart: string;
}

export async function getWeeklyHoursTrend(
  supabase: SupabaseClient,
  weekStarts: Date[],
): Promise<WeeklyHoursPoint[]> {
  const points: WeeklyHoursPoint[] = [];
  for (const start of weekStarts) {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const minutes = await getWeeklyPlannedMinutes(supabase, start, end);
    points.push({
      label: start.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" }),
      hours: Math.round((minutes / 60) * 10) / 10,
      weekStart: start.toISOString().slice(0, 10),
    });
  }
  return points;
}

export interface NailsFacialsTrendPoint {
  label: string;
  nailsAmount: number;
  facialsAmount: number;
}

export async function getNailsFacialsTrend(
  supabase: SupabaseClient,
  monthStarts: Date[],
): Promise<NailsFacialsTrendPoint[]> {
  const points: NailsFacialsTrendPoint[] = [];
  for (let i = 0; i < monthStarts.length; i++) {
    const start = monthStarts[i];
    const end =
      i + 1 < monthStarts.length
        ? monthStarts[i + 1]
        : new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const stats = await getIncomePerHourByCategory(supabase, start, end);
    const nails = stats.find((s) => s.category === "ציפורניים");
    const facials = stats.find((s) => s.category === FACIALS_CATEGORY);
    points.push({
      label: start.toLocaleDateString("he-IL", { month: "short" }),
      nailsAmount: nails?.amount ?? 0,
      facialsAmount: facials?.amount ?? 0,
    });
  }
  return points;
}

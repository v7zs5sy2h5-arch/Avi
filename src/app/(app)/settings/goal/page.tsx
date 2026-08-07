import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { weekStart, isoDate } from "@/lib/dates";
import { GoalForm } from "./GoalForm";
import type { WeeklyGoal } from "@/types/database";

export default async function WeeklyGoalPage() {
  const supabase = await createClient();
  const thisWeek = weekStart(new Date());
  const lastWeekStart = new Date(thisWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const [{ data: current }, { data: previous }] = await Promise.all([
    supabase
      .from("weekly_goals")
      .select("*")
      .eq("week_start", isoDate(thisWeek))
      .maybeSingle<WeeklyGoal>(),
    supabase
      .from("weekly_goals")
      .select("*")
      .eq("week_start", isoDate(lastWeekStart))
      .maybeSingle<WeeklyGoal>(),
  ]);

  const suggestedCount = current
    ? current.target_count
    : previous
      ? Math.round(previous.target_count * 1.1)
      : 0;
  const suggestedRevenue = current
    ? current.target_revenue
    : previous
      ? Math.round(previous.target_revenue * 1.1)
      : 0;

  return (
    <div>
      <Header title="יעד שבועי 🎯" />
      <div className="px-4">
        <Card className="mt-2 mb-4">
          <p className="text-sm text-text-muted">
            שבוע נוכחי: {isoDate(thisWeek)}
            {!current && previous ? " · ההצעה מבוססת על +10% מהשבוע הקודם" : ""}
          </p>
        </Card>
      </div>
      <GoalForm
        weekStartIso={isoDate(thisWeek)}
        suggestedCount={suggestedCount}
        suggestedRevenue={suggestedRevenue}
      />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { weekStart, isoDate } from "@/lib/dates";
import { getFacialsWeekComparison } from "@/lib/reports";
import { GoalForm } from "./GoalForm";
import type { WeeklyGoal } from "@/types/database";

export default async function WeeklyGoalPage() {
  const supabase = await createClient();
  const thisWeek = weekStart(new Date());
  const thisWeekEnd = new Date(thisWeek);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
  const lastWeekStart = new Date(thisWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const [{ data: current }, comparison] = await Promise.all([
    supabase
      .from("weekly_goals")
      .select("*")
      .eq("week_start", isoDate(thisWeek))
      .maybeSingle<WeeklyGoal>(),
    getFacialsWeekComparison(supabase, thisWeek, thisWeekEnd, lastWeekStart, thisWeek),
  ]);

  const suggestedCount = Math.max(current?.target_count ?? 0, comparison.autoTargetCount);
  const suggestedRevenue = Math.max(current?.target_revenue ?? 0, comparison.autoTargetRevenue);

  return (
    <div>
      <Header title="יעד שבועי 🎯" />
      <div className="px-4">
        <Card className="mt-2 mb-4">
          <p className="text-sm text-text-muted">
            שבוע נוכחי: {isoDate(thisWeek)}
            <br />
            השבוע שעבר בוצעו {comparison.lastWeekCount} טיפולי פנים ✨ — ההצעה כאן
            היא לפחות 10% יותר, כדי שתמיד תהיה צמיחה.
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

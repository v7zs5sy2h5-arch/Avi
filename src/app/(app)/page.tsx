import Link from "next/link";
import Image from "next/image";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  getMonthlySummary,
  getIncomePerHourByCategory,
  getWeeklyWorkedMinutes,
  getFacialsWeekProgress,
  getFacialsWeekComparison,
  getFacialsTreatmentUsage,
  getCategoryCounts,
} from "@/lib/reports";
import { weekStart, isoDate } from "@/lib/dates";
import { cn, formatCurrency, minutesToHm } from "@/lib/utils";
import { getCategoryStyle, getTreatmentEmoji } from "@/lib/categoryStyle";
import { FACIALS_CATEGORY, NAILS_CATEGORY } from "@/types/database";
import type { WeeklyGoal } from "@/types/database";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string }>;
}) {
  const { logged } = await searchParams;
  const supabase = await createClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = addDays(todayStart, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const wStart = weekStart(now);
  const wEnd = addDays(wStart, 7);
  const lastWStart = addDays(wStart, -7);

  const [
    summary,
    perHour,
    weeklyMinutes,
    facialsProgress,
    facialsComparison,
    facialsUsage,
    todayCounts,
    weekCounts,
    { data: goal },
  ] = await Promise.all([
    getMonthlySummary(supabase, monthStart, monthEnd),
    getIncomePerHourByCategory(supabase, monthStart, monthEnd),
    getWeeklyWorkedMinutes(supabase, wStart, wEnd),
    getFacialsWeekProgress(supabase, wStart, wEnd),
    getFacialsWeekComparison(supabase, wStart, wEnd, lastWStart, wStart),
    getFacialsTreatmentUsage(supabase, wStart, wEnd),
    getCategoryCounts(supabase, todayStart, todayEnd),
    getCategoryCounts(supabase, wStart, wEnd),
    supabase
      .from("weekly_goals")
      .select("*")
      .eq("week_start", isoDate(wStart))
      .maybeSingle<WeeklyGoal>(),
  ]);

  const nailsStat = perHour.find((s) => s.category === NAILS_CATEGORY);
  const facialsStat = perHour.find((s) => s.category === FACIALS_CATEGORY);
  const maxPerHour = Math.max(nailsStat?.perHour ?? 0, facialsStat?.perHour ?? 0, 1);

  const effectiveTargetCount = Math.max(
    goal?.target_count ?? 0,
    facialsComparison.autoTargetCount,
  );
  const effectiveTargetRevenue = Math.max(
    goal?.target_revenue ?? 0,
    facialsComparison.autoTargetRevenue,
  );
  const remainingForGoal = Math.max(effectiveTargetCount - facialsProgress.completedCount, 0);
  const hitGoal = facialsProgress.completedCount >= effectiveTargetCount;
  const suggestedTreatments = facialsUsage
    .slice()
    .sort((a, b) => a.count - b.count)
    .slice(0, 2);

  const weekTotal = weekCounts.nailsCount + weekCounts.facialsCount;
  const facialsSharePct = weekTotal > 0 ? Math.round((weekCounts.facialsCount / weekTotal) * 100) : 0;
  const nailsStyle = getCategoryStyle(NAILS_CATEGORY);
  const facialsStyle = getCategoryStyle(FACIALS_CATEGORY);

  return (
    <div className="px-4">
      <header className="flex items-center justify-between pt-4 pb-2">
        <h1 className="font-heading text-xl">שלום קרן 👋</h1>
        <Image src="/logo-mark.png" alt="" width={24} height={34} />
      </header>

      {logged ? (
        <div className="mt-2 rounded-2xl bg-success-bg px-4 py-2.5 text-center text-sm font-semibold text-success">
          ✅ הטיפול תועד בהצלחה!
        </div>
      ) : null}

      <p className="mt-4 mb-2 text-sm font-semibold text-text">מה תיעדת עכשיו?</p>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/log/nails"
          className={cn(
            "card-interactive flex h-36 flex-col items-center justify-center gap-1.5 rounded-3xl shadow-md active:scale-[0.97] transition-transform",
            nailsStyle.solidBg,
          )}
        >
          <span className="text-4xl" aria-hidden>
            💅
          </span>
          <span className="text-lg font-bold text-white">ציפורניים</span>
          <span className="text-sm font-medium text-white/90">
            {weekCounts.nailsCount} השבוע
          </span>
        </Link>
        <Link
          href="/log/facials"
          className={cn(
            "card-interactive flex h-36 flex-col items-center justify-center gap-1.5 rounded-3xl shadow-md active:scale-[0.97] transition-transform",
            facialsStyle.solidBg,
          )}
        >
          <span className="text-4xl" aria-hidden>
            ✨
          </span>
          <span className="text-lg font-bold text-white">טיפולי פנים</span>
          <span className="text-sm font-medium text-white/90">
            {weekCounts.facialsCount} השבוע
          </span>
        </Link>
      </div>

      <section className="mt-5">
        <Card>
          <CardTitle>⚖️ מאזן השבוע — ציפורניים מול טיפולי פנים</CardTitle>
          {weekTotal === 0 ? (
            <p className="py-4 text-center text-sm text-text-muted">
              עוד לא תועדו טיפולים השבוע
            </p>
          ) : (
            <>
              <div className="flex h-4 overflow-hidden rounded-full bg-border-soft">
                <div
                  className="h-full bg-nails"
                  style={{ width: `${100 - facialsSharePct}%` }}
                />
                <div className="h-full bg-facials" style={{ width: `${facialsSharePct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-nails">
                  💅 {weekCounts.nailsCount} ציפורניים
                </span>
                <span className="font-semibold text-facials">
                  ✨ {weekCounts.facialsCount} טיפולי פנים
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-text">
                {facialsSharePct >= 60
                  ? "🎉 מעולה! רוב העבודה השבוע היא טיפולי פנים — בדיוק לשם זה חותרים."
                  : facialsSharePct >= 40
                    ? "💪 קרוב לאיזון — עוד קצת יותר טיפולי פנים ופחות ציפורניים ותהיה שם."
                    : "🎯 השבוע עדיין נשען בעיקר על ציפורניים — כל טיפול פנים נוסף מקרב אותך ליעד."}
              </p>
            </>
          )}
        </Card>
      </section>

      <section className="mt-3">
        <Card className={hitGoal ? "border-success/40" : undefined}>
          <CardTitle>✨ יעד שבועי — טיפולי פנים (לא ציפורניים)</CardTitle>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-semibold">
              {facialsProgress.completedCount} / {effectiveTargetCount} טיפולים
            </span>
            <span className="text-sm text-text-muted">
              {formatCurrency(facialsProgress.completedRevenue)} /{" "}
              {formatCurrency(effectiveTargetRevenue)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-border-soft overflow-hidden">
            <div
              className={cn("h-full transition-all", hitGoal ? "bg-success" : "gradient-primary")}
              style={{
                width: `${Math.min(
                  (facialsProgress.completedCount / Math.max(effectiveTargetCount, 1)) * 100,
                  100,
                )}%`,
              }}
            />
          </div>

          {hitGoal ? (
            <p className="mt-3 text-sm font-semibold text-success">
              🎉 כל הכבוד! עברת את היעד השבועי — גידול של לפחות 10% משבוע שעבר
              ({facialsComparison.lastWeekCount} → {facialsProgress.completedCount}). תמשיכי כך!
            </p>
          ) : (
            <div className="mt-3 rounded-xl bg-facials-bg/60 p-3">
              <p className="text-sm font-semibold text-facials">
                💪 עוד {remainingForGoal} טיפולי פנים השבוע כדי לגדול לפחות ב-10%
                משבוע שעבר ({facialsComparison.lastWeekCount} ➜ {effectiveTargetCount})
              </p>
              {suggestedTreatments.length > 0 ? (
                <p className="mt-1.5 text-sm text-text-muted">
                  כדאי להציע ללקוחות השבוע:{" "}
                  {suggestedTreatments
                    .map((t) => `${getTreatmentEmoji(t.name, FACIALS_CATEGORY)} ${t.name}`)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          )}
        </Card>
      </section>

      <section className="mt-3">
        <Card>
          <CardTitle>📊 הכנסה לשעת עבודה (החודש)</CardTitle>
          <div className="space-y-3">
            <HourBar
              label="ציפורניים"
              value={nailsStat?.perHour ?? 0}
              max={maxPerHour}
              colorClass="bg-nails"
            />
            <HourBar
              label="טיפולי פנים"
              value={facialsStat?.perHour ?? 0}
              max={maxPerHour}
              colorClass="bg-facials"
            />
          </div>
        </Card>
      </section>

      <section className="mt-3">
        <Card>
          <CardTitle>💰 הכנסות והוצאות החודש</CardTitle>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-text-muted">רווח נקי</span>
            <span className="text-2xl font-bold text-accent-strong">
              {formatCurrency(summary.profit)}
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">הכנסה מטיפולים</span>
              <span>{formatCurrency(summary.treatmentIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">הכנסה ממכירת מוצרים</span>
              <span>{formatCurrency(summary.productIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">הוצאות</span>
              <span>{formatCurrency(summary.totalExpenses)}</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-3 mb-6">
        <Card>
          <CardTitle>⏱️ שעות עבודה השבוע</CardTitle>
          <p className="text-2xl font-bold">{minutesToHm(weeklyMinutes)}</p>
          <p className="text-sm text-text-muted mt-1">
            {todayCounts.nailsCount + todayCounts.facialsCount} טיפולים תועדו היום (
            {todayCounts.nailsCount} ציפורניים, {todayCounts.facialsCount} טיפולי פנים)
          </p>
        </Card>
      </section>
    </div>
  );
}

function HourBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{formatCurrency(value)} / שעה</span>
      </div>
      <div className="h-2.5 rounded-full bg-border-soft overflow-hidden">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

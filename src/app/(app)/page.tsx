import Link from "next/link";
import Image from "next/image";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Clock, Sparkles } from "lucide-react";
import { PendingPaymentsModal } from "@/components/PendingPaymentsModal";
import { getPendingPayments } from "@/lib/payments";
import {
  getMonthlySummary,
  getIncomePerHourByCategory,
  getWeeklyPlannedMinutes,
  getFacialsWeekProgress,
  getFacialsWeekComparison,
  getFacialsTreatmentUsage,
} from "@/lib/reports";
import { weekStart, isoDate } from "@/lib/dates";
import { cn, formatCurrency, formatTime, minutesToHm } from "@/lib/utils";
import { getCategoryStyle, getTreatmentEmoji } from "@/lib/categoryStyle";
import { FACIALS_CATEGORY, NAILS_CATEGORY } from "@/types/database";
import type { AppointmentWithRelations, WeeklyGoal } from "@/types/database";

export default async function DashboardPage() {
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
    { data: todayAppointments },
    pendingItems,
    summary,
    todaySummary,
    perHour,
    weeklyMinutes,
    facialsProgress,
    facialsComparison,
    facialsUsage,
    { data: goal },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, client:clients(*), treatment:treatments(*)")
      .gte("starts_at", todayStart.toISOString())
      .lt("starts_at", todayEnd.toISOString())
      .order("starts_at")
      .returns<AppointmentWithRelations[]>(),
    getPendingPayments(supabase),
    getMonthlySummary(supabase, monthStart, monthEnd),
    getMonthlySummary(supabase, todayStart, todayEnd),
    getIncomePerHourByCategory(supabase, monthStart, monthEnd),
    getWeeklyPlannedMinutes(supabase, wStart, wEnd),
    getFacialsWeekProgress(supabase, wStart, wEnd),
    getFacialsWeekComparison(supabase, wStart, wEnd, lastWStart, wStart),
    getFacialsTreatmentUsage(supabase, wStart, wEnd),
    supabase
      .from("weekly_goals")
      .select("*")
      .eq("week_start", isoDate(wStart))
      .maybeSingle<WeeklyGoal>(),
  ]);

  const todayList = todayAppointments ?? [];
  const activeAppt = todayList.find((a) => {
    if (a.status !== "planned") return false;
    const s = new Date(a.starts_at).getTime();
    const e = s + a.duration_minutes * 60000;
    return now.getTime() >= s && now.getTime() < e;
  });
  const nextAppt = todayList.find(
    (a) => a.status === "planned" && new Date(a.starts_at).getTime() > now.getTime(),
  );
  const completedTodayCount = todayList.filter((a) => a.status === "completed").length;
  const remainingTodayCount = todayList.filter(
    (a) => a.status === "planned" && new Date(a.starts_at).getTime() >= now.getTime(),
  ).length;

  const todayCategoryMap = new Map<string, { total: number; completed: number }>();
  for (const a of todayList) {
    if (a.status === "cancelled" || a.status === "no_show") continue;
    const cat = a.treatment?.category ?? "אחר";
    const entry = todayCategoryMap.get(cat) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (a.status === "completed") entry.completed += 1;
    todayCategoryMap.set(cat, entry);
  }
  const todayCategoryBreakdown = Array.from(todayCategoryMap.entries());

  let nowActionText: string;
  if (activeAppt) {
    nowActionText = "🟢 באמצע טיפול כרגע — תתמקדי בלקוחה, השאר יחכה";
  } else if (nextAppt) {
    const minutesUntil = Math.round(
      (new Date(nextAppt.starts_at).getTime() - now.getTime()) / 60000,
    );
    nowActionText =
      minutesUntil <= 15
        ? `⏰ התור הבא מתחיל בעוד ${minutesUntil} דק' — כדאי להתכונן`
        : minutesUntil < 120
          ? `🕒 יש לך כ-${Math.round(minutesUntil / 60) || 1} שעות פנויות עד התור הבא`
          : "🌿 יש לך זמן פנוי עד התור הבא — הזדמנות טובה לחזור ללקוחות ממתינות או לתכנן קדימה";
  } else if (todayList.length > 0) {
    nowActionText = "🎉 סיימת את כל התורים של היום! זמן טוב לבדוק תשלומים ממתינים או לתכנן מחר";
  } else {
    nowActionText = "🌱 אין תורים היום — יום פנוי לתכנון, שיווק או מנוחה";
  }

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

  const summaryText = `השבוע ${facialsProgress.completedCount} טיפולי פנים מתוך יעד ${effectiveTargetCount} (לפחות 10% יותר מ-${facialsComparison.lastWeekCount} בשבוע שעבר), ועוד ${facialsProgress.plannedCount} מתוכננים ביומן`;

  return (
    <div className="px-4">
      <header className="flex items-center justify-between pt-4 pb-2">
        <h1 className="font-heading text-xl">שלום קרן 👋</h1>
        <Image src="/logo-mark.png" alt="" width={24} height={34} />
      </header>

      <section className="mt-2">
        <div className="rounded-3xl gradient-header border border-accent-soft p-4 shadow-sm shadow-black/[0.04]">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-strong">
              <Sparkles size={16} /> תמונת מצב — עכשיו
            </p>
            <p className="text-sm font-semibold text-text-muted">
              {now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {activeAppt || nextAppt ? (
            (() => {
              const appt = (activeAppt ?? nextAppt)!;
              const style = getCategoryStyle(appt.treatment?.category ?? "");
              const emoji = getTreatmentEmoji(
                appt.treatment?.name ?? appt.treatment_name_freetext,
                appt.treatment?.category ?? "",
              );
              return (
                <Link
                  href={`/appointments/${appt.id}`}
                  className="card-interactive mt-3 flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm shadow-black/[0.03]"
                >
                  <div
                    className={cn(
                      "flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-1.5",
                      style.bg,
                      style.text,
                    )}
                  >
                    <Clock size={14} className="mb-0.5" />
                    <span className="text-sm font-bold">{formatTime(appt.starts_at)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-accent-strong">
                      {activeAppt ? "🟢 עכשיו אצלך" : "⏭️ הלקוחה הבאה"}
                    </p>
                    <p className="truncate text-[15px] font-semibold">{appt.client?.name}</p>
                    <p className="truncate text-sm text-text-muted">
                      <span aria-hidden>{emoji}</span>{" "}
                      {appt.treatment?.name ?? appt.treatment_name_freetext}
                    </p>
                  </div>
                </Link>
              );
            })()
          ) : (
            <p className="mt-3 rounded-2xl bg-surface p-3 text-center text-sm text-text-muted shadow-sm shadow-black/[0.03]">
              {todayList.length > 0 ? "אין עוד תורים היום 🎉" : "אין תורים היום 🌱"}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface p-2.5 text-center shadow-sm shadow-black/[0.03]">
              <p className="text-lg font-bold text-success">{completedTodayCount}</p>
              <p className="text-[11px] text-text-muted">בוצעו היום</p>
            </div>
            <div className="rounded-xl bg-surface p-2.5 text-center shadow-sm shadow-black/[0.03]">
              <p className="text-lg font-bold text-accent-strong">{remainingTodayCount}</p>
              <p className="text-[11px] text-text-muted">נותרו היום</p>
            </div>
          </div>

          {todayCategoryBreakdown.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {todayCategoryBreakdown.map(([cat, stat]) => {
                const style = getCategoryStyle(cat);
                return (
                  <span
                    key={cat}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold",
                      style.bg,
                      style.text,
                    )}
                  >
                    <span aria-hidden>{style.emoji}</span> {cat} · {stat.completed}/{stat.total}
                  </span>
                );
              })}
            </div>
          ) : null}

          <p className="mt-3 text-sm font-medium">{nowActionText}</p>

          <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface p-3 shadow-sm shadow-black/[0.03]">
            <span className="text-sm text-text-muted">💰 הכנסות היום</span>
            <span className="text-lg font-bold text-accent-strong">
              {formatCurrency(todaySummary.totalIncome)}
            </span>
          </div>
        </div>
      </section>

      <LinkButton href="/appointments/new" size="lg" className="w-full mt-4">
        + קביעת תור חדש
      </LinkButton>

      <section className="mt-6">
        <p className="text-sm font-semibold text-text mb-2">📅 כל התורים של היום</p>
        {!todayAppointments || todayAppointments.length === 0 ? (
          <Card className="text-center text-sm text-text-muted py-6">
            אין תורים היום
          </Card>
        ) : (
          <div className="space-y-2">
            {todayAppointments.map((appt) => {
              const style = getCategoryStyle(
                appt.treatment?.category ?? "",
              );
              const treatmentEmoji = getTreatmentEmoji(
                appt.treatment?.name ?? appt.treatment_name_freetext,
                appt.treatment?.category ?? "",
              );
              return (
                <Link
                  key={appt.id}
                  href={`/appointments/${appt.id}`}
                  className="card-interactive flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-3.5 shadow-sm shadow-black/[0.03]"
                >
                  <div
                    className={cn(
                      "w-14 shrink-0 rounded-xl py-1.5 text-center text-sm font-bold",
                      style.bg,
                      style.text,
                    )}
                  >
                    {formatTime(appt.starts_at)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[15px] font-semibold">
                      {appt.client?.name}
                    </p>
                    <p className="truncate text-sm text-text-muted">
                      <span aria-hidden>{treatmentEmoji}</span>{" "}
                      {appt.treatment?.name ?? appt.treatment_name_freetext}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6">
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
              className={cn(
                "h-full transition-all",
                hitGoal ? "bg-success" : "gradient-primary",
              )}
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

          <p className="mt-3 text-sm text-text-muted">{summaryText}</p>
        </Card>
      </section>

      <section className="mt-3 mb-6">
        <Card>
          <CardTitle>⏱️ שעות עבודה השבוע</CardTitle>
          <p className="text-2xl font-bold">{minutesToHm(weeklyMinutes)}</p>
          <p className="text-sm text-text-muted mt-1">
            סה&quot;כ שעות מתוכננות/בוצעו השבוע (כולל תורים עתידיים השבוע)
          </p>
        </Card>
      </section>

      <PendingPaymentsModal items={pendingItems} />
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

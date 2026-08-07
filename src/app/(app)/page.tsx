import Link from "next/link";
import Image from "next/image";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { PendingPaymentsModal } from "@/components/PendingPaymentsModal";
import { getPendingPayments } from "@/lib/payments";
import {
  getMonthlySummary,
  getIncomePerHourByCategory,
  getWeeklyPlannedMinutes,
  getFacialsWeekProgress,
} from "@/lib/reports";
import { weekStart, isoDate } from "@/lib/dates";
import { formatCurrency, formatTime, minutesToHm } from "@/lib/utils";
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

  const [
    { data: todayAppointments },
    pendingItems,
    summary,
    perHour,
    weeklyMinutes,
    facialsProgress,
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
    getIncomePerHourByCategory(supabase, monthStart, monthEnd),
    getWeeklyPlannedMinutes(supabase, wStart, wEnd),
    getFacialsWeekProgress(supabase, wStart, wEnd),
    supabase
      .from("weekly_goals")
      .select("*")
      .eq("week_start", isoDate(wStart))
      .maybeSingle<WeeklyGoal>(),
  ]);

  const nailsStat = perHour.find((s) => s.category === NAILS_CATEGORY);
  const facialsStat = perHour.find((s) => s.category === FACIALS_CATEGORY);
  const maxPerHour = Math.max(nailsStat?.perHour ?? 0, facialsStat?.perHour ?? 0, 1);

  const summaryText = goal
    ? `השבוע ${facialsProgress.completedCount} טיפולי פנים מתוך יעד ${goal.target_count}, ועוד ${facialsProgress.plannedCount} מתוכננים ביומן`
    : `השבוע ${facialsProgress.completedCount} טיפולי פנים בוצעו, ועוד ${facialsProgress.plannedCount} מתוכננים ביומן`;

  return (
    <div className="px-4">
      <header className="flex items-center justify-between pt-4 pb-2">
        <h1 className="font-heading text-xl">שלום קרן</h1>
        <Image src="/logo-mark.png" alt="" width={24} height={34} />
      </header>

      <LinkButton href="/appointments/new" size="lg" className="w-full mt-2">
        + קביעת תור חדש
      </LinkButton>

      <section className="mt-6">
        <p className="text-sm text-text-muted mb-2">התורים של היום</p>
        {!todayAppointments || todayAppointments.length === 0 ? (
          <Card className="text-center text-sm text-text-muted py-6">
            אין תורים היום
          </Card>
        ) : (
          <div className="space-y-2">
            {todayAppointments.map((appt) => (
              <Link
                key={appt.id}
                href={`/appointments/${appt.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-3.5"
              >
                <div className="w-14 shrink-0 text-center text-sm font-medium text-accent-strong">
                  {formatTime(appt.starts_at)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[15px] font-medium">
                    {appt.client?.name}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {appt.treatment?.name ?? appt.treatment_name_freetext}
                  </p>
                </div>
                <StatusBadge status={appt.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <Card>
          <CardTitle>הכנסות והוצאות החודש</CardTitle>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-text-muted">רווח נקי</span>
            <span className="text-2xl font-medium text-accent-strong">
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
          <CardTitle>הכנסה לשעת עבודה (החודש)</CardTitle>
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
          <CardTitle>יעד שבועי — טיפולי פנים</CardTitle>
          {goal ? (
            <>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm">
                  {facialsProgress.completedCount} / {goal.target_count} טיפולים
                </span>
                <span className="text-sm text-text-muted">
                  {formatCurrency(facialsProgress.completedRevenue)} /{" "}
                  {formatCurrency(goal.target_revenue)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-border-soft overflow-hidden">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${Math.min(
                      (facialsProgress.completedCount / Math.max(goal.target_count, 1)) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <Link href="/settings/goal" className="text-sm text-accent-strong underline">
              הגדירי יעד שבועי
            </Link>
          )}
          <p className="mt-3 text-sm text-text-muted">{summaryText}</p>
        </Card>
      </section>

      <section className="mt-3 mb-6">
        <Card>
          <CardTitle>שעות עבודה השבוע</CardTitle>
          <p className="text-2xl font-medium">{minutesToHm(weeklyMinutes)}</p>
          <p className="text-xs text-text-muted mt-1">
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

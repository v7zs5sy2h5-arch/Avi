import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  getMonthlySummary,
  getIncomePerHourByTreatment,
  getFollowUpRate,
  getNailsFacialsTrend,
  getWeeklyHoursTrend,
} from "@/lib/reports";
import { getTransactions } from "@/lib/transactions";
import { weekStart } from "@/lib/dates";
import { NailsFacialsChart } from "@/components/charts/NailsFacialsChart";
import { WeeklyHoursChart } from "@/components/charts/WeeklyHoursChart";
import type { WeeklyGoal } from "@/types/database";

function parseMonth(param?: string) {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function monthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const monthStart = parseMonth(params.month);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const kind = params.kind ?? "all";

  const supabase = await createClient();

  const monthStarts6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth() - 5 + i, 1);
    return d;
  });

  const weekStarts8 = Array.from({ length: 8 }, (_, i) => {
    const d = weekStart(new Date());
    d.setDate(d.getDate() - 7 * (7 - i));
    return d;
  });

  const [
    summary,
    treatmentStats,
    followUp,
    nailsFacialsTrend,
    weeklyHoursTrend,
    transactions,
    { data: goals },
  ] = await Promise.all([
    getMonthlySummary(supabase, monthStart, monthEnd),
    getIncomePerHourByTreatment(supabase, monthStart, monthEnd),
    getFollowUpRate(supabase, monthStart, monthEnd),
    getNailsFacialsTrend(supabase, monthStarts6),
    getWeeklyHoursTrend(supabase, weekStarts8),
    getTransactions(supabase, monthStart, monthEnd),
    supabase
      .from("weekly_goals")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(10)
      .returns<WeeklyGoal[]>(),
  ]);

  const filteredTransactions =
    kind === "all" ? transactions : transactions.filter((t) => t.kind === kind);

  const prevMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
  const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  return (
    <div className="px-4">
      <Header title="דוחות" />

      <div className="flex items-center justify-between pt-3">
        <Link href={`/reports?month=${monthParam(prevMonth)}`} className="p-2 text-text-muted">
          <ChevronRight size={20} />
        </Link>
        <p className="font-heading text-lg">
          {monthStart.toLocaleDateString("he-IL", { month: "long", year: "numeric" })}
        </p>
        <Link href={`/reports?month=${monthParam(nextMonth)}`} className="p-2 text-text-muted">
          <ChevronLeft size={20} />
        </Link>
      </div>

      <Card className="mt-4">
        <CardTitle>סיכום חודשי (שולם בפועל)</CardTitle>
        <div className="space-y-1.5 text-sm">
          <Row label="הכנסה מטיפולים" value={formatCurrency(summary.treatmentIncome)} />
          <Row label="הכנסה ממכירת מוצרים" value={formatCurrency(summary.productIncome)} />
          <Row label="סה&quot;כ הכנסות" value={formatCurrency(summary.totalIncome)} strong />
          <Row label="הוצאות" value={formatCurrency(summary.totalExpenses)} />
          <div className="border-t border-border-soft mt-2 pt-2">
            <Row label="רווח נקי" value={formatCurrency(summary.profit)} strong accent />
          </div>
        </div>
      </Card>

      <Card className="mt-3">
        <CardTitle>הכנסה לשעת עבודה לפי טיפול</CardTitle>
        {treatmentStats.length === 0 ? (
          <p className="text-sm text-text-muted">אין נתונים החודש</p>
        ) : (
          <div className="space-y-2">
            {treatmentStats.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="truncate">{t.name}</span>
                <span className="text-text-muted">
                  {t.count}× · {formatCurrency(t.perHour)}/שעה
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-3">
        <CardTitle>שיעור תור חוזר</CardTitle>
        <p className="text-2xl font-medium text-accent-strong">
          {Math.round(followUp.rate * 100)}%
        </p>
        <p className="text-sm text-text-muted mt-1">
          {followUp.followUpCount} מתוך {followUp.completedCount} תורים שהושלמו הובילו לתור המשך
        </p>
      </Card>

      <Card className="mt-3">
        <CardTitle>ציפורניים מול טיפולי פנים — מגמה</CardTitle>
        <NailsFacialsChart data={nailsFacialsTrend} />
      </Card>

      <Card className="mt-3">
        <CardTitle>שעות עבודה שבועיות — מגמה</CardTitle>
        <WeeklyHoursChart data={weeklyHoursTrend} />
      </Card>

      <Card className="mt-3">
        <CardTitle>היסטוריית יעדים שבועיים</CardTitle>
        {!goals || goals.length === 0 ? (
          <p className="text-sm text-text-muted">אין עדיין יעדים שמורים</p>
        ) : (
          <div className="space-y-2">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{formatDate(g.week_start)}</span>
                <span>
                  יעד: {g.target_count} · {formatCurrency(g.target_revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-3 mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-text-muted">כל התנועות</p>
          <div className="flex gap-1.5">
            {[
              { value: "all", label: "הכל" },
              { value: "treatment", label: "טיפולים" },
              { value: "product", label: "מוצרים" },
              { value: "expense", label: "הוצאות" },
            ].map((f) => (
              <Link
                key={f.value}
                href={`/reports?month=${monthParam(monthStart)}&kind=${f.value}`}
                className={cn(
                  "rounded-full px-2.5 py-1 text-sm",
                  kind === f.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-soft text-text-muted",
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">אין תנועות</p>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((t) => (
              <div key={`${t.kind}-${t.id}`} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="truncate">{t.label}</p>
                  <p className="truncate text-sm text-text-muted">
                    {formatDate(t.date)}
                    {t.subLabel ? ` · ${t.subLabel}` : ""}
                    {t.isPaid === false ? " · ממתין לתשלום" : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-medium",
                    t.amount < 0 ? "text-warning" : "text-success",
                  )}
                >
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span
        className={cn(
          strong && "font-medium",
          accent && "text-accent-strong text-lg",
        )}
      >
        {value}
      </span>
    </div>
  );
}

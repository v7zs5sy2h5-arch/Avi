import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { weekStart, isoDate } from "@/lib/dates";
import { formatTime, formatCurrency, cn } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronRight, ChevronLeft, Clock } from "lucide-react";
import type { AppointmentWithRelations } from "@/types/database";

const BUSY_THRESHOLD_MINUTES = 6 * 60;
const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const anchor = params.date ? new Date(params.date) : new Date();
  const selected = params.date ?? isoDate(new Date());
  const start = weekStart(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const rangeStart = days[0];
  const rangeEnd = addDays(days[6], 1);

  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, client:clients(*), treatment:treatments(*)")
    .gte("starts_at", rangeStart.toISOString())
    .lt("starts_at", rangeEnd.toISOString())
    .order("starts_at");

  const byDay = new Map<string, AppointmentWithRelations[]>();
  const minutesByDay = new Map<string, number>();
  for (const appt of (appointments ?? []) as AppointmentWithRelations[]) {
    const key = isoDate(new Date(appt.starts_at));
    byDay.set(key, [...(byDay.get(key) ?? []), appt]);
    if (appt.status === "planned" || appt.status === "completed") {
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + appt.duration_minutes);
    }
  }

  const selectedList = (byDay.get(selected) ?? []).sort(
    (a, b) => +new Date(a.starts_at) - +new Date(b.starts_at),
  );

  const prevWeek = isoDate(addDays(start, -7));
  const nextWeek = isoDate(addDays(start, 7));

  return (
    <div>
      <Header title="יומן" />

      <div className="flex items-center justify-between px-4 pt-3">
        <Link
          href={`/calendar?date=${prevWeek}`}
          className="p-2 text-text-muted"
          aria-label="שבוע קודם"
        >
          <ChevronRight size={20} />
        </Link>
        <p className="text-sm text-text-muted">
          {days[0].toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
          {" – "}
          {days[6].toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
        </p>
        <Link
          href={`/calendar?date=${nextWeek}`}
          className="p-2 text-text-muted"
          aria-label="שבוע הבא"
        >
          <ChevronLeft size={20} />
        </Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 py-3">
        {days.map((day, i) => {
          const key = isoDate(day);
          const isSelected = key === selected;
          const isToday = key === isoDate(new Date());
          const count = byDay.get(key)?.length ?? 0;
          const busy = (minutesByDay.get(key) ?? 0) > BUSY_THRESHOLD_MINUTES;
          return (
            <Link
              key={key}
              href={`/calendar?date=${key}`}
              className={cn(
                "flex min-w-[52px] flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 transition-colors",
                isSelected
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border-soft bg-surface text-text",
              )}
            >
              <span className="text-[11px] opacity-80">
                {WEEKDAY_LABELS[i]}
              </span>
              <span
                className={cn(
                  "text-base font-medium",
                  isToday && !isSelected ? "text-accent-strong" : "",
                )}
              >
                {day.getDate()}
              </span>
              <span className="flex h-1.5 items-center">
                {count > 0 ? (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isSelected ? "bg-accent-foreground" : "bg-accent",
                    )}
                  />
                ) : null}
              </span>
              {busy ? (
                <span className="text-[9px] leading-none">עמוס</span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="space-y-2.5 px-4 pb-6">
        {selectedList.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-muted">
            אין תורים ביום זה
          </p>
        ) : (
          selectedList.map((appt) => (
            <Link
              key={appt.id}
              href={`/appointments/${appt.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-3.5"
            >
              <div className="flex flex-col items-center justify-center w-14 shrink-0 text-accent-strong">
                <Clock size={16} className="mb-0.5" />
                <span className="text-sm font-medium">
                  {formatTime(appt.starts_at)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] font-medium">
                  {appt.client?.name}
                </p>
                <p className="truncate text-sm text-text-muted">
                  {appt.treatment?.name ?? appt.treatment_name_freetext}
                  {appt.expected_price != null
                    ? ` · ${formatCurrency(appt.expected_price)}`
                    : ""}
                </p>
              </div>
              <StatusBadge status={appt.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

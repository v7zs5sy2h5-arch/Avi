import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { weekStart, isoDate } from "@/lib/dates";
import { formatTime, cn } from "@/lib/utils";
import { getCategoryStyle, getTreatmentEmoji } from "@/lib/categoryStyle";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { AppointmentWithRelations } from "@/types/database";

const BUSY_THRESHOLD_MINUTES = 6 * 60;
const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 44;
const HOUR_COL_WIDTH = 34;
const MIN_BLOCK_HEIGHT = 24;
type ViewMode = "day" | "week" | "month";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view: ViewMode =
    params.view === "week" ? "week" : params.view === "month" ? "month" : "day";
  const anchor = params.date ? new Date(params.date) : new Date();
  const selected = params.date ?? isoDate(new Date());
  const weekStartDate = weekStart(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const todayKey = isoDate(new Date());
  const currentMonth = anchor.getMonth();

  let rangeStart: Date;
  let rangeEnd: Date;
  const monthWeeks: Date[][] = [];
  if (view === "month") {
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = weekStart(monthStart);
    const lastDayOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const gridEnd = addDays(weekStart(lastDayOfMonth), 7);
    rangeStart = gridStart;
    rangeEnd = gridEnd;
    for (let cursor = gridStart; cursor < gridEnd; cursor = addDays(cursor, 7)) {
      monthWeeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    }
  } else {
    rangeStart = days[0];
    rangeEnd = addDays(days[6], 1);
  }

  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, client:clients(*), treatment:treatments(*)")
    .gte("starts_at", rangeStart.toISOString())
    .lt("starts_at", rangeEnd.toISOString())
    .order("starts_at");

  const rangeAppointments = (appointments ?? []) as AppointmentWithRelations[];

  const byDay = new Map<string, AppointmentWithRelations[]>();
  const minutesByDay = new Map<string, number>();
  let minHour = 8;
  let maxHour = 20;
  for (const appt of rangeAppointments) {
    const key = isoDate(new Date(appt.starts_at));
    byDay.set(key, [...(byDay.get(key) ?? []), appt]);
    if (appt.status === "planned" || appt.status === "completed") {
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + appt.duration_minutes);
    }
    if (view !== "month") {
      const s = new Date(appt.starts_at);
      const startHour = s.getHours() + s.getMinutes() / 60;
      const endHour = startHour + appt.duration_minutes / 60;
      minHour = Math.min(minHour, Math.floor(startHour));
      maxHour = Math.max(maxHour, Math.ceil(endHour));
    }
  }
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);

  const gridDays = view === "day" ? [new Date(selected)] : days;

  const prevWeek = isoDate(addDays(weekStartDate, -7));
  const nextWeek = isoDate(addDays(weekStartDate, 7));
  const prevDay = isoDate(addDays(new Date(selected), -1));
  const nextDay = isoDate(addDays(new Date(selected), 1));
  const monthAnchor = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const prevMonth = isoDate(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1));
  const nextMonth = isoDate(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1));

  const navPrevHref =
    view === "month"
      ? `/calendar?date=${prevMonth}&view=month`
      : view === "day"
        ? `/calendar?date=${prevDay}&view=day`
        : `/calendar?date=${prevWeek}&view=week`;
  const navNextHref =
    view === "month"
      ? `/calendar?date=${nextMonth}&view=month`
      : view === "day"
        ? `/calendar?date=${nextDay}&view=day`
        : `/calendar?date=${nextWeek}&view=week`;
  const navLabel =
    view === "month" ? (
      monthAnchor.toLocaleDateString("he-IL", { month: "long", year: "numeric" })
    ) : view === "day" ? (
      new Date(selected).toLocaleDateString("he-IL", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      })
    ) : (
      <>
        {days[0].toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
        {" – "}
        {days[6].toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
      </>
    );

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowOffset =
    nowHour >= minHour && nowHour <= maxHour ? (nowHour - minHour) * ROW_HEIGHT : null;

  function viewHref(v: ViewMode) {
    return `/calendar?date=${selected}&view=${v}`;
  }

  return (
    <div>
      <Header title="יומן 📅" />

      <div className="flex items-center justify-between px-4 pt-3">
        <Link
          href={navPrevHref}
          className="rounded-full p-2 text-text-muted hover:bg-surface-soft"
          aria-label="קודם"
        >
          <ChevronRight size={20} />
        </Link>
        <p className="text-[15px] font-bold text-text">{navLabel}</p>
        <Link
          href={navNextHref}
          className="rounded-full p-2 text-text-muted hover:bg-surface-soft"
          aria-label="הבא"
        >
          <ChevronLeft size={20} />
        </Link>
      </div>

      <div className="flex justify-center gap-1.5 px-4 pt-3 pb-1">
        {(
          [
            { value: "day", label: "יומי" },
            { value: "week", label: "שבועי" },
            { value: "month", label: "חודשי" },
          ] as const
        ).map((tab) => (
          <Link
            key={tab.value}
            href={viewHref(tab.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              view === tab.value
                ? "gradient-primary text-accent-foreground shadow-sm shadow-accent/25"
                : "bg-surface-soft text-text-muted",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {view === "day" ? (
        <div className="flex gap-1.5 overflow-x-auto px-4 pt-2 pb-3">
          {days.map((day, i) => {
            const key = isoDate(day);
            const isSelected = key === selected;
            const isToday = key === todayKey;
            const count = byDay.get(key)?.length ?? 0;
            const busy = (minutesByDay.get(key) ?? 0) > BUSY_THRESHOLD_MINUTES;
            return (
              <Link
                key={key}
                href={`/calendar?date=${key}&view=day`}
                className={cn(
                  "flex min-w-[48px] flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors",
                  isSelected ? "bg-surface-soft" : "",
                )}
              >
                <span className="text-[11px] text-text-muted">{WEEKDAY_LABELS[i]}</span>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-bold",
                    isSelected
                      ? "gradient-primary text-accent-foreground shadow-sm shadow-accent/25"
                      : isToday
                        ? "text-accent-strong"
                        : "text-text",
                  )}
                >
                  {day.getDate()}
                </span>
                <span className="flex h-1.5 items-center">
                  {count > 0 ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                </span>
                {busy ? <span className="text-[9px] leading-none">🔥</span> : null}
              </Link>
            );
          })}
        </div>
      ) : null}

      {view === "month" ? (
        <div className="mx-4 mt-1 mb-6 overflow-hidden rounded-2xl border border-border-soft bg-surface">
          <div className="grid grid-cols-7 border-b border-border-soft">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-2 text-center text-[11px] text-text-muted">
                {label}
              </div>
            ))}
          </div>
          {monthWeeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => {
                const key = isoDate(day);
                const isToday = key === todayKey;
                const inMonth = day.getMonth() === currentMonth;
                const list = (byDay.get(key) ?? []).sort(
                  (a, b) => +new Date(a.starts_at) - +new Date(b.starts_at),
                );
                const visible = list.slice(0, 2);
                const extra = list.length - visible.length;
                return (
                  <Link
                    key={key}
                    href={`/calendar?date=${key}&view=day`}
                    className="min-h-[74px] border-b border-l border-border-soft/70 p-1 last:border-l-0 [&:nth-child(7n)]:border-l-0"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-semibold",
                        isToday
                          ? "gradient-primary text-accent-foreground"
                          : !inMonth
                            ? "text-text-muted/40"
                            : "text-text",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {visible.map((appt) => {
                        const style = getCategoryStyle(appt.treatment?.category ?? "");
                        return (
                          <div
                            key={appt.id}
                            className={cn(
                              "truncate rounded px-1 py-[1px] text-[9px] font-medium leading-tight",
                              style.solidBg,
                              style.solidText,
                            )}
                          >
                            {formatTime(appt.starts_at)}
                          </div>
                        );
                      })}
                      {extra > 0 ? (
                        <div className="px-1 text-[9px] text-text-muted">+{extra}</div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-4 mt-1 mb-6 overflow-hidden rounded-2xl border border-border-soft bg-surface">
          <div className="flex">
            <div
              className="shrink-0 border-l border-border-soft"
              style={{ width: HOUR_COL_WIDTH }}
            >
              <div style={{ height: HEADER_HEIGHT }} className="border-b border-border-soft" />
              {hours.map((h) => (
                <div key={h} style={{ height: ROW_HEIGHT }} className="relative">
                  <span className="absolute -top-2 inset-x-0 text-center text-[10px] text-text-muted">
                    {h}
                  </span>
                </div>
              ))}
            </div>
            <div className={cn("flex-1", view === "week" ? "overflow-x-auto" : "")}>
              <div
                className="flex"
                style={view === "week" ? { width: gridDays.length * 68 } : undefined}
              >
                {gridDays.map((day, i) => {
                  const key = isoDate(day);
                  const isToday = key === todayKey;
                  const list = byDay.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      className={cn(
                        "shrink-0 border-l border-border-soft last:border-l-0",
                        view === "day" ? "flex-1" : "",
                      )}
                      style={view === "week" ? { width: 68 } : undefined}
                    >
                      {view === "week" ? (
                        <Link
                          href={`/calendar?date=${key}&view=day`}
                          className="flex flex-col items-center justify-center gap-0.5 border-b border-border-soft"
                          style={{ height: HEADER_HEIGHT }}
                        >
                          <span className="text-[10px] text-text-muted">{WEEKDAY_LABELS[i]}</span>
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold",
                              isToday
                                ? "gradient-primary text-accent-foreground"
                                : "text-text",
                            )}
                          >
                            {day.getDate()}
                          </span>
                        </Link>
                      ) : (
                        <div
                          style={{ height: HEADER_HEIGHT }}
                          className="border-b border-border-soft"
                        />
                      )}
                      <div className="relative" style={{ height: hours.length * ROW_HEIGHT }}>
                        {hours.map((h, hi) => (
                          <div
                            key={h}
                            className="absolute inset-x-0 border-t border-border-soft/70"
                            style={{ top: hi * ROW_HEIGHT }}
                          />
                        ))}
                        {isToday && nowOffset != null ? (
                          <div
                            className="absolute inset-x-0 z-10 flex items-center"
                            style={{ top: nowOffset }}
                          >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning shadow" />
                            <span className="h-[2px] flex-1 bg-warning" />
                          </div>
                        ) : null}
                        {list.map((appt) => {
                          const s = new Date(appt.starts_at);
                          const startHour = s.getHours() + s.getMinutes() / 60;
                          const top = (startHour - minHour) * ROW_HEIGHT;
                          const height = Math.max(
                            (appt.duration_minutes / 60) * ROW_HEIGHT,
                            MIN_BLOCK_HEIGHT,
                          );
                          const category = appt.treatment?.category ?? "";
                          const style = getCategoryStyle(category);
                          const emoji = getTreatmentEmoji(
                            appt.treatment?.name ?? appt.treatment_name_freetext,
                            category,
                          );
                          return (
                            <Link
                              key={appt.id}
                              href={`/appointments/${appt.id}`}
                              className={cn(
                                "absolute inset-x-1 overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-tight shadow-sm",
                                style.solidBg,
                                style.solidText,
                              )}
                              style={{ top, height }}
                            >
                              <div className="font-bold">
                                <span aria-hidden>{emoji}</span> {formatTime(appt.starts_at)}
                              </div>
                              {height > 32 ? (
                                <div className="truncate font-medium opacity-95">
                                  {appt.client?.name}
                                </div>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { weekStart, isoDate } from "@/lib/dates";
import { formatTime, formatCurrency, cn } from "@/lib/utils";
import { getCategoryStyle, getTreatmentEmoji } from "@/lib/categoryStyle";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronRight, ChevronLeft, Clock } from "lucide-react";
import { NAILS_CATEGORY, FACIALS_CATEGORY } from "@/types/database";
import type { AppointmentWithRelations } from "@/types/database";

const BUSY_THRESHOLD_MINUTES = 6 * 60;
const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 44;
const COL_WIDTH = 72;
const HOUR_COL_WIDTH = 34;
const MIN_BLOCK_HEIGHT = 24;
type ViewMode = "day" | "week" | "month";

function dotClass(category: string): string {
  if (category === NAILS_CATEGORY) return "bg-nails";
  if (category === FACIALS_CATEGORY) return "bg-facials";
  return "bg-accent";
}

function edgeBorderClass(category: string): string {
  if (category === NAILS_CATEGORY) return "border-r-nails";
  if (category === FACIALS_CATEGORY) return "border-r-facials";
  return "border-r-accent";
}

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

  const selectedList = (byDay.get(selected) ?? []).sort(
    (a, b) => +new Date(a.starts_at) - +new Date(b.starts_at),
  );

  const prevWeek = isoDate(addDays(weekStartDate, -7));
  const nextWeek = isoDate(addDays(weekStartDate, 7));
  const monthAnchor = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const prevMonth = isoDate(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1));
  const nextMonth = isoDate(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1));

  const navPrevHref =
    view === "month" ? `/calendar?date=${prevMonth}&view=month` : `/calendar?date=${prevWeek}&view=${view}`;
  const navNextHref =
    view === "month" ? `/calendar?date=${nextMonth}&view=month` : `/calendar?date=${nextWeek}&view=${view}`;
  const navLabel =
    view === "month" ? (
      monthAnchor.toLocaleDateString("he-IL", { month: "long", year: "numeric" })
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
        <>
          <div className="flex gap-1.5 overflow-x-auto px-4 py-3">
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
                    "flex min-w-[52px] flex-col items-center gap-1 rounded-2xl border-2 px-2 py-2.5 transition-colors",
                    isSelected
                      ? "border-accent gradient-primary text-accent-foreground shadow-sm shadow-accent/25"
                      : isToday
                        ? "border-accent-soft bg-accent-soft/60 text-text"
                        : "border-border-soft bg-surface text-text",
                  )}
                >
                  <span className="text-[11px] opacity-80">{WEEKDAY_LABELS[i]}</span>
                  <span
                    className={cn(
                      "text-base font-bold",
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
                  {busy ? <span className="text-[9px] leading-none">עמוס 🔥</span> : null}
                </Link>
              );
            })}
          </div>

          <div className="space-y-2.5 px-4 pb-6">
            {selectedList.length === 0 ? (
              <div className="rounded-3xl border border-border-soft bg-surface py-10 text-center shadow-sm shadow-black/[0.03]">
                <p className="text-2xl">🌿</p>
                <p className="mt-1 text-sm text-text-muted">אין תורים ביום זה</p>
              </div>
            ) : (
              selectedList.map((appt) => <AppointmentRow key={appt.id} appt={appt} />)
            )}
          </div>
        </>
      ) : view === "week" ? (
        <div className="mx-4 mt-2 mb-6 overflow-hidden rounded-3xl border border-border-soft bg-surface shadow-sm shadow-black/[0.04]">
          <div className="flex">
            <div
              className="shrink-0 border-l border-border-soft/70 bg-surface-soft/50"
              style={{ width: HOUR_COL_WIDTH }}
            >
              <div style={{ height: HEADER_HEIGHT }} className="border-b border-border-soft/60" />
              {hours.map((h) => (
                <div key={h} style={{ height: ROW_HEIGHT }} className="relative">
                  <span className="absolute -top-2 inset-x-0 text-center text-[10px] font-medium text-text-muted">
                    {h}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex" style={{ width: days.length * COL_WIDTH }}>
                {days.map((day, i) => {
                  const key = isoDate(day);
                  const isToday = key === todayKey;
                  const list = byDay.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      className="shrink-0 border-l border-border-soft/40 last:border-l-0"
                      style={{ width: COL_WIDTH }}
                    >
                      <Link
                        href={`/calendar?date=${key}&view=day`}
                        className="flex flex-col items-center justify-center gap-0.5 border-b border-border-soft/60"
                        style={{ height: HEADER_HEIGHT }}
                      >
                        <span className="text-[10px] text-text-muted">{WEEKDAY_LABELS[i]}</span>
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold",
                            isToday
                              ? "gradient-primary text-accent-foreground shadow-sm shadow-accent/25"
                              : "text-text",
                          )}
                        >
                          {day.getDate()}
                        </span>
                      </Link>
                      <div className="relative" style={{ height: hours.length * ROW_HEIGHT }}>
                        {hours.map((h, hi) => (
                          <div
                            key={h}
                            className={cn(
                              "absolute inset-x-0 border-t border-border-soft/40",
                              hi % 2 === 1 && "bg-surface-soft/40",
                            )}
                            style={{ top: hi * ROW_HEIGHT, height: ROW_HEIGHT }}
                          />
                        ))}
                        {isToday && nowOffset != null ? (
                          <div
                            className="absolute inset-x-0 z-10 flex items-center"
                            style={{ top: nowOffset }}
                          >
                            <span className="h-2 w-2 shrink-0 rounded-full bg-warning shadow" />
                            <span className="h-0.5 flex-1 bg-warning" />
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
                                "absolute inset-x-1 overflow-hidden rounded-lg border-r-[3px] px-1.5 py-0.5 text-[10px] leading-tight shadow-sm shadow-black/[0.05]",
                                style.bg,
                                style.text,
                                edgeBorderClass(category),
                              )}
                              style={{ top, height }}
                            >
                              <div className="font-bold">
                                <span aria-hidden>{emoji}</span> {formatTime(appt.starts_at)}
                              </div>
                              {height > 32 ? (
                                <div className="truncate font-medium">{appt.client?.name}</div>
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
      ) : (
        <div className="mx-4 mt-2 mb-6 overflow-hidden rounded-3xl border border-border-soft bg-surface shadow-sm shadow-black/[0.04]">
          <div className="grid grid-cols-7 bg-surface-soft/60 py-2">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center text-[11px] font-semibold text-text-muted">
                {label}
              </div>
            ))}
          </div>
          <div className="space-y-1 p-2">
            {monthWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const key = isoDate(day);
                  const isToday = key === todayKey;
                  const inMonth = day.getMonth() === currentMonth;
                  const list = byDay.get(key) ?? [];
                  const categories = Array.from(
                    new Set(list.map((a) => a.treatment?.category ?? "אחר")),
                  ).slice(0, 4);
                  return (
                    <Link
                      key={key}
                      href={`/calendar?date=${key}&view=day`}
                      className="flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors hover:bg-surface-soft"
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                          isToday
                            ? "gradient-primary text-accent-foreground shadow-sm shadow-accent/25"
                            : !inMonth
                              ? "text-text-muted/40"
                              : "text-text",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <span className="flex h-1.5 items-center gap-0.5">
                        {categories.map((c, ci) => (
                          <span key={ci} className={cn("h-1.5 w-1.5 rounded-full", dotClass(c))} />
                        ))}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentRow({ appt }: { appt: AppointmentWithRelations }) {
  const style = getCategoryStyle(appt.treatment?.category ?? "");
  const emoji = getTreatmentEmoji(
    appt.treatment?.name ?? appt.treatment_name_freetext,
    appt.treatment?.category ?? "",
  );
  return (
    <Link
      href={`/appointments/${appt.id}`}
      className="card-interactive flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-3.5 shadow-sm shadow-black/[0.03]"
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center w-14 shrink-0 rounded-xl py-1.5",
          style.bg,
          style.text,
        )}
      >
        <Clock size={16} className="mb-0.5" />
        <span className="text-sm font-bold">{formatTime(appt.starts_at)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[15px] font-semibold">{appt.client?.name}</p>
        <p className="truncate text-sm text-text-muted">
          <span aria-hidden>{emoji}</span>{" "}
          {appt.treatment?.name ?? appt.treatment_name_freetext}
          {appt.expected_price != null ? ` · ${formatCurrency(appt.expected_price)}` : ""}
        </p>
      </div>
      <StatusBadge status={appt.status} />
    </Link>
  );
}

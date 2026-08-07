import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { weekStart, isoDate } from "@/lib/dates";
import { formatTime, formatCurrency, cn } from "@/lib/utils";
import { getCategoryStyle, getTreatmentEmoji } from "@/lib/categoryStyle";
import { StatusBadge } from "@/components/StatusBadge";
import { ChevronRight, ChevronLeft, Clock } from "lucide-react";
import type { AppointmentWithRelations } from "@/types/database";

const BUSY_THRESHOLD_MINUTES = 6 * 60;
const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 44;
const COL_WIDTH = 68;
const MIN_BLOCK_HEIGHT = 22;
type ViewMode = "day" | "week";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view: ViewMode = params.view === "week" ? "week" : "day";
  const anchor = params.date ? new Date(params.date) : new Date();
  const selected = params.date ?? isoDate(new Date());
  const start = weekStart(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const rangeStart = days[0];
  const rangeEnd = addDays(days[6], 1);
  const todayKey = isoDate(new Date());

  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, client:clients(*), treatment:treatments(*)")
    .gte("starts_at", rangeStart.toISOString())
    .lt("starts_at", rangeEnd.toISOString())
    .order("starts_at");

  const weekAppointments = (appointments ?? []) as AppointmentWithRelations[];

  const byDay = new Map<string, AppointmentWithRelations[]>();
  const minutesByDay = new Map<string, number>();
  let minHour = 8;
  let maxHour = 20;
  for (const appt of weekAppointments) {
    const key = isoDate(new Date(appt.starts_at));
    byDay.set(key, [...(byDay.get(key) ?? []), appt]);
    if (appt.status === "planned" || appt.status === "completed") {
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + appt.duration_minutes);
    }
    const s = new Date(appt.starts_at);
    const startHour = s.getHours() + s.getMinutes() / 60;
    const endHour = startHour + appt.duration_minutes / 60;
    minHour = Math.min(minHour, Math.floor(startHour));
    maxHour = Math.max(maxHour, Math.ceil(endHour));
  }
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);

  const selectedList = (byDay.get(selected) ?? []).sort(
    (a, b) => +new Date(a.starts_at) - +new Date(b.starts_at),
  );

  const prevWeek = isoDate(addDays(start, -7));
  const nextWeek = isoDate(addDays(start, 7));

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
          href={`/calendar?date=${prevWeek}&view=${view}`}
          className="p-2 text-text-muted"
          aria-label="שבוע קודם"
        >
          <ChevronRight size={20} />
        </Link>
        <p className="text-sm font-semibold text-text">
          {days[0].toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
          {" – "}
          {days[6].toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
        </p>
        <Link
          href={`/calendar?date=${nextWeek}&view=${view}`}
          className="p-2 text-text-muted"
          aria-label="שבוע הבא"
        >
          <ChevronLeft size={20} />
        </Link>
      </div>

      <div className="flex justify-center gap-1.5 px-4 pt-3">
        {(
          [
            { value: "day", label: "יומי" },
            { value: "week", label: "שבועי" },
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
              <p className="py-10 text-center text-sm text-text-muted">אין תורים ביום זה</p>
            ) : (
              selectedList.map((appt) => <AppointmentRow key={appt.id} appt={appt} />)
            )}
          </div>
        </>
      ) : (
        <div className="flex px-4 pb-6 pt-3">
          <div className="shrink-0" style={{ width: 30 }}>
            <div style={{ height: HEADER_HEIGHT }} />
            {hours.map((h) => (
              <div key={h} style={{ height: ROW_HEIGHT }} className="relative">
                <span className="absolute -top-2 right-0 text-[10px] text-text-muted">
                  {h}:00
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
                    className="shrink-0 border-r border-border-soft/60 first:border-l"
                    style={{ width: COL_WIDTH }}
                  >
                    <Link
                      href={`/calendar?date=${key}&view=day`}
                      className={cn(
                        "flex flex-col items-center justify-center gap-0.5 rounded-lg mx-0.5",
                        isToday ? "bg-accent-soft/60 text-accent-strong font-bold" : "text-text",
                      )}
                      style={{ height: HEADER_HEIGHT }}
                    >
                      <span className="text-[10px] opacity-80">{WEEKDAY_LABELS[i]}</span>
                      <span className="text-sm font-bold">{day.getDate()}</span>
                    </Link>
                    <div
                      className="relative"
                      style={{ height: hours.length * ROW_HEIGHT }}
                    >
                      {hours.map((h, hi) => (
                        <div
                          key={h}
                          className="absolute inset-x-0 border-t border-border-soft/50"
                          style={{ top: hi * ROW_HEIGHT }}
                        />
                      ))}
                      {isToday && nowOffset != null ? (
                        <div
                          className="absolute inset-x-0 z-10 h-0.5 bg-warning"
                          style={{ top: nowOffset }}
                        />
                      ) : null}
                      {list.map((appt) => {
                        const s = new Date(appt.starts_at);
                        const startHour = s.getHours() + s.getMinutes() / 60;
                        const top = (startHour - minHour) * ROW_HEIGHT;
                        const height = Math.max(
                          (appt.duration_minutes / 60) * ROW_HEIGHT,
                          MIN_BLOCK_HEIGHT,
                        );
                        const style = getCategoryStyle(appt.treatment?.category ?? "");
                        const emoji = getTreatmentEmoji(
                          appt.treatment?.name ?? appt.treatment_name_freetext,
                          appt.treatment?.category ?? "",
                        );
                        return (
                          <Link
                            key={appt.id}
                            href={`/appointments/${appt.id}`}
                            className={cn(
                              "absolute inset-x-0.5 overflow-hidden rounded-md border px-1 py-0.5 text-[10px] leading-tight",
                              style.bg,
                              style.text,
                              style.border,
                            )}
                            style={{ top, height }}
                          >
                            <div className="font-bold">
                              <span aria-hidden>{emoji}</span> {formatTime(appt.starts_at)}
                            </div>
                            {height > 30 ? (
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

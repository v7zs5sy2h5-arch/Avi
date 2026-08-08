import { addDays } from "date-fns";
import { weekStart, isoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { DailyBreakdown } from "@/lib/reports";

const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

function hebrewDateLabel(date: Date): string {
  try {
    return new Intl.DateTimeFormat("he-u-ca-hebrew", {
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    return "";
  }
}

export function MonthCalendarGrid({
  monthStart,
  breakdown,
}: {
  monthStart: Date;
  breakdown: DailyBreakdown[];
}) {
  const byDate = new Map(breakdown.map((d) => [d.date, d]));
  const currentMonth = monthStart.getMonth();
  const gridStart = weekStart(monthStart);
  const lastDayOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const gridEnd = addDays(weekStart(lastDayOfMonth), 7);
  const weeks: Date[][] = [];
  for (let cursor = gridStart; cursor < gridEnd; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
  }
  const todayKey = isoDate(new Date());

  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface">
      <div className="grid grid-cols-7 bg-surface-soft/60 py-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[11px] font-semibold text-text-muted">
            {label}
          </div>
        ))}
      </div>
      <div className="space-y-1 p-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const key = isoDate(day);
              const isToday = key === todayKey;
              const inMonth = day.getMonth() === currentMonth;
              const d = byDate.get(key);
              return (
                <div
                  key={key}
                  className="min-h-[76px] rounded-lg border border-border-soft/60 p-1"
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
                  <p
                    className={cn(
                      "truncate text-[9px] leading-none",
                      inMonth ? "text-text-muted" : "text-text-muted/40",
                    )}
                  >
                    {hebrewDateLabel(day)}
                  </p>
                  {d ? (
                    <div className="mt-1 space-y-0.5">
                      {d.nailsCount > 0 ? (
                        <div className="truncate rounded bg-nails px-1 py-[1px] text-[9px] font-medium text-white">
                          💅 {d.nailsCount}
                        </div>
                      ) : null}
                      {d.facialsCount > 0 ? (
                        <div className="truncate rounded bg-facials px-1 py-[1px] text-[9px] font-medium text-white">
                          ✨ {d.facialsCount}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

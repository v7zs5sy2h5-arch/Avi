import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/types/database";

const styles: Record<AppointmentStatus, string> = {
  planned: "bg-accent-soft text-accent-strong",
  completed: "bg-success-bg text-success",
  cancelled: "bg-border-soft text-text-muted line-through",
  no_show: "bg-warning-bg text-warning",
};

const emojis: Record<AppointmentStatus, string> = {
  planned: "🗓️",
  completed: "✅",
  cancelled: "❌",
  no_show: "⚠️",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold",
        styles[status],
      )}
    >
      <span aria-hidden>{emojis[status]}</span>
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  );
}

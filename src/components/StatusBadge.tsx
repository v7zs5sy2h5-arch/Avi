import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/types/database";

const styles: Record<AppointmentStatus, string> = {
  planned: "bg-surface text-text-muted",
  completed: "bg-success-bg text-success",
  cancelled: "bg-border-soft text-text-muted line-through",
  no_show: "bg-warning-bg text-warning",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium",
        styles[status],
      )}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  );
}

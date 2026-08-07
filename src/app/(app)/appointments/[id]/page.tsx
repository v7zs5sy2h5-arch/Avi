import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate, formatTime, minutesToHm } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/types/database";
import type { AppointmentWithRelations, TreatmentLog } from "@/types/database";
import { updateAppointmentStatus, deleteAppointment } from "../actions";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*, client:clients(*), treatment:treatments(*)")
    .eq("id", id)
    .maybeSingle<AppointmentWithRelations>();

  if (!appointment) notFound();

  const { data: log } = await supabase
    .from("treatment_log")
    .select("*")
    .eq("appointment_id", id)
    .maybeSingle<TreatmentLog>();

  const cancel = updateAppointmentStatus.bind(null, id, "cancelled");
  const noShow = updateAppointmentStatus.bind(null, id, "no_show");
  const reopen = updateAppointmentStatus.bind(null, id, "planned");
  const remove = deleteAppointment.bind(null, id);

  return (
    <div className="px-4">
      <Header title="פרטי תור" />

      <Card className="mt-4">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/clients/${appointment.client_id}`}
              className="text-lg font-medium underline-offset-2 hover:underline"
            >
              {appointment.client?.name}
            </Link>
            <p className="text-sm text-text-muted mt-0.5">
              {appointment.treatment?.name ?? appointment.treatment_name_freetext}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-text-muted">תאריך</dt>
          <dd>{formatDate(appointment.starts_at)}</dd>
          <dt className="text-text-muted">שעה</dt>
          <dd>{formatTime(appointment.starts_at)}</dd>
          <dt className="text-text-muted">משך</dt>
          <dd>{minutesToHm(appointment.duration_minutes)}</dd>
          {appointment.expected_price != null ? (
            <>
              <dt className="text-text-muted">מחיר משוער</dt>
              <dd>{formatCurrency(appointment.expected_price)}</dd>
            </>
          ) : null}
        </dl>

        {appointment.notes ? (
          <p className="mt-3 rounded-xl bg-surface-soft p-3 text-sm">
            {appointment.notes}
          </p>
        ) : null}
      </Card>

      {log ? (
        <Card className="mt-3">
          <p className="text-sm font-medium mb-2">רשומת הכנסה</p>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-text-muted">סכום</dt>
            <dd>{formatCurrency(log.amount)}</dd>
            <dt className="text-text-muted">אמצעי תשלום</dt>
            <dd>{PAYMENT_METHOD_LABELS[log.payment_method]}</dd>
            <dt className="text-text-muted">סטטוס תשלום</dt>
            <dd>{log.is_paid ? "שולם" : "ממתין לתשלום"}</dd>
          </dl>
        </Card>
      ) : null}

      <div className="mt-5 space-y-2.5 pb-8">
        {appointment.status === "planned" ? (
          <>
            <LinkButton
              href={`/appointments/${id}/complete`}
              size="lg"
              className="w-full"
            >
              סימון כהושלם
            </LinkButton>
            <LinkButton
              href={`/appointments/${id}/edit`}
              variant="secondary"
              className="w-full"
            >
              עריכת תור
            </LinkButton>
            <div className="grid grid-cols-2 gap-2.5">
              <form action={noShow}>
                <Button variant="secondary" className="w-full">
                  לא הגיעה
                </Button>
              </form>
              <form action={cancel}>
                <Button variant="danger" className="w-full">
                  ביטול תור
                </Button>
              </form>
            </div>
          </>
        ) : null}

        {(appointment.status === "cancelled" ||
          appointment.status === "no_show") && (
          <form action={reopen}>
            <Button variant="secondary" className="w-full">
              החזרה לסטטוס &ldquo;מתוכנן&rdquo;
            </Button>
          </form>
        )}

        {appointment.status !== "completed" ? (
          <form action={remove}>
            <Button variant="ghost" className="w-full text-warning">
              מחיקת תור
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

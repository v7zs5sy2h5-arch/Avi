import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import type { AppointmentWithRelations } from "@/types/database";
import { FollowUpForm } from "./FollowUpForm";

export default async function FollowUpPage({
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

  return (
    <div>
      <Header title="תור המשך 🔁" />
      <FollowUpForm
        appointmentId={id}
        isSeries={Boolean(appointment.treatment?.is_series)}
        seriesSize={appointment.treatment?.series_size ?? null}
      />
    </div>
  );
}

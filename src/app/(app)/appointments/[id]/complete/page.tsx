import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import type { AppointmentWithRelations } from "@/types/database";
import { CompleteForm } from "./CompleteForm";

export default async function CompleteAppointmentPage({
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
  if (appointment.status === "completed") redirect(`/appointments/${id}`);

  return (
    <div>
      <Header title="אישור הכנסה 💰" />
      <CompleteForm appointment={appointment} />
    </div>
  );
}

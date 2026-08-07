import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import type { Appointment } from "@/types/database";
import { EditAppointmentForm } from "./EditAppointmentForm";

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle<Appointment>();

  if (!appointment) notFound();

  return (
    <div>
      <Header title="עריכת תור" />
      <EditAppointmentForm appointment={appointment} />
    </div>
  );
}

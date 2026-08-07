import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { NewAppointmentForm } from "./NewAppointmentForm";

export default async function NewAppointmentPage() {
  const supabase = await createClient();

  const [{ data: treatments }, { data: clients }] = await Promise.all([
    supabase.from("treatments").select("*").order("sort_order"),
    supabase.from("clients").select("*").order("name"),
  ]);

  return (
    <div>
      <Header title="קביעת תור חדש" />
      <Suspense>
        <NewAppointmentForm
          clients={clients ?? []}
          treatments={treatments ?? []}
        />
      </Suspense>
    </div>
  );
}

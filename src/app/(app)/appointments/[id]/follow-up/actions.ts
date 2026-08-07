"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FollowUpState {
  error?: string;
}

export async function createFollowUps(
  appointmentId: string,
  _prevState: FollowUpState,
  formData: FormData,
): Promise<FollowUpState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*, treatment:treatments(*)")
    .eq("id", appointmentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appointment) return { error: "התור לא נמצא" };

  const intervalDays = Number(formData.get("interval_days") ?? 0);
  if (!intervalDays || intervalDays < 1) {
    return { error: "יש להזין מרווח ימים תקין" };
  }

  const isSeries = Boolean(appointment.treatment?.is_series);
  const count = isSeries
    ? Math.max((appointment.treatment?.series_size ?? 1) - 1, 0)
    : 1;

  if (count === 0) {
    redirect(`/appointments/${appointmentId}`);
  }

  const duration =
    appointment.treatment?.duration_minutes ?? appointment.duration_minutes;
  const price = appointment.treatment?.price ?? appointment.expected_price;
  const baseDate = new Date(appointment.starts_at);

  const rows = Array.from({ length: count }, (_, i) => {
    const startsAt = new Date(baseDate);
    startsAt.setDate(startsAt.getDate() + intervalDays * (i + 1));
    return {
      user_id: user.id,
      client_id: appointment.client_id,
      treatment_id: appointment.treatment_id,
      expected_price: price,
      starts_at: startsAt.toISOString(),
      duration_minutes: duration,
      status: "planned" as const,
      follow_up_of_appointment_id: appointmentId,
    };
  });

  const { error } = await supabase.from("appointments").insert(rows);

  if (error) {
    return {
      error:
        "לפחות אחד מהתורים המוצעים חופף לתור קיים — נסי מרווח אחר או קבעי ידנית ביומן",
    };
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/reports");
  redirect(`/calendar`);
}

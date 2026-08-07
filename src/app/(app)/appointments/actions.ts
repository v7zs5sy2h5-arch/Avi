"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveClientId } from "@/lib/clients";
import type { AppointmentStatus } from "@/types/database";

export interface FormActionState {
  error?: string;
}

function isOverlapError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23P01"
  );
}

export async function createAppointment(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const clientId = String(formData.get("client_id") ?? "") || null;
  const clientName = String(formData.get("client_name") ?? "") || null;
  const treatmentId = String(formData.get("treatment_id") ?? "") || null;
  const treatmentFreetext =
    String(formData.get("treatment_name_freetext") ?? "").trim() || null;
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const durationMinutes = Number(formData.get("duration_minutes") ?? 30);
  const priceRaw = String(formData.get("price") ?? "").trim();
  const expectedPrice = priceRaw ? Number(priceRaw) : null;
  const markCompleted = formData.get("mark_completed") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const followUpOf = String(formData.get("follow_up_of") ?? "") || null;

  if (!date || !time) return { error: "יש לבחור תאריך ושעה" };
  if (!treatmentId && !treatmentFreetext)
    return { error: "יש לבחור טיפול" };

  let finalClientId: string | null;
  try {
    finalClientId = await resolveClientId(supabase, user.id, clientId, clientName);
  } catch {
    return { error: "שגיאה בשמירת פרטי הלקוחה" };
  }
  if (!finalClientId) return { error: "יש לבחור או להזין שם לקוחה" };

  const startsAt = new Date(`${date}T${time}:00`);
  const status: AppointmentStatus = markCompleted ? "completed" : "planned";

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      client_id: finalClientId,
      treatment_id: treatmentId,
      treatment_name_freetext: treatmentId ? null : treatmentFreetext,
      expected_price: expectedPrice,
      starts_at: startsAt.toISOString(),
      duration_minutes: durationMinutes,
      status,
      notes,
      follow_up_of_appointment_id: followUpOf,
    })
    .select("id")
    .single();

  if (error) {
    if (isOverlapError(error)) {
      return {
        error: "השעה הזו חופפת לתור קיים ביומן — בחרי שעה אחרת",
      };
    }
    return { error: "שגיאה בשמירת התור" };
  }

  revalidatePath("/calendar");
  revalidatePath("/");

  if (markCompleted) {
    redirect(`/appointments/${appointment.id}/complete`);
  }
  redirect(`/calendar`);
}

export async function updateAppointment(
  appointmentId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const durationMinutes = Number(formData.get("duration_minutes") ?? 30);
  const priceRaw = String(formData.get("price") ?? "").trim();
  const expectedPrice = priceRaw ? Number(priceRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!date || !time) return { error: "יש לבחור תאריך ושעה" };

  const startsAt = new Date(`${date}T${time}:00`);

  const { error } = await supabase
    .from("appointments")
    .update({
      starts_at: startsAt.toISOString(),
      duration_minutes: durationMinutes,
      expected_price: expectedPrice,
      notes,
    })
    .eq("id", appointmentId)
    .eq("user_id", user.id);

  if (error) {
    if (isOverlapError(error)) {
      return {
        error: "השעה הזו חופפת לתור קיים ביומן — בחרי שעה אחרת",
      };
    }
    return { error: "שגיאה בעדכון התור" };
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath(`/appointments/${appointmentId}`);
  redirect(`/appointments/${appointmentId}`);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("user_id", user.id);

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath(`/appointments/${appointmentId}`);
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("user_id", user.id);

  revalidatePath("/calendar");
  revalidatePath("/");
  redirect("/calendar");
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NAILS_CATEGORY } from "@/types/database";
import type { PaymentMethod } from "@/types/database";

export interface CompleteState {
  error?: string;
}

export async function completeAppointment(
  appointmentId: string,
  _prevState: CompleteState,
  formData: FormData,
): Promise<CompleteState> {
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

  const amount = Number(formData.get("amount") ?? 0);
  const durationMinutes = Number(
    formData.get("duration_minutes") ?? appointment.duration_minutes,
  );
  const paymentMethod = String(
    formData.get("payment_method") ?? "cash",
  ) as PaymentMethod;
  const isPaid = formData.get("is_paid") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const productName = String(formData.get("product_name") ?? "").trim();
  const productAmountRaw = String(formData.get("product_amount") ?? "").trim();

  if (!amount || amount <= 0) return { error: "יש להזין סכום תקין" };

  const treatmentName =
    appointment.treatment?.name ?? appointment.treatment_name_freetext ?? "טיפול";

  const { data: log, error } = await supabase
    .from("treatment_log")
    .insert({
      user_id: user.id,
      appointment_id: appointmentId,
      client_id: appointment.client_id,
      treatment_id: appointment.treatment_id,
      treatment_name: treatmentName,
      amount,
      duration_minutes: durationMinutes,
      payment_method: paymentMethod,
      is_paid: isPaid,
      performed_at: appointment.starts_at,
      notes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "שגיאה בשמירת ההכנסה — ייתכן שהתור כבר סומן כהושלם" };
  }

  await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appointmentId)
    .eq("user_id", user.id);

  if (productName && productAmountRaw) {
    await supabase.from("product_sales").insert({
      user_id: user.id,
      client_id: appointment.client_id,
      treatment_log_id: log.id,
      product_name: productName,
      amount: Number(productAmountRaw),
      is_paid: isPaid,
    });
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/payments-pending");
  revalidatePath("/reports");

  const offerFollowUp =
    appointment.treatment?.category === NAILS_CATEGORY ||
    appointment.treatment?.is_series;

  if (offerFollowUp) {
    redirect(`/appointments/${appointmentId}/follow-up`);
  }
  redirect(`/appointments/${appointmentId}`);
}

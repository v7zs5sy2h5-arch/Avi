"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugFromCategory } from "@/lib/categoryStyle";
import type { PaymentMethod } from "@/types/database";

export interface LogState {
  error?: string;
}

export async function logTreatment(
  treatmentId: string,
  _prevState: LogState,
  formData: FormData,
): Promise<LogState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const { data: treatment } = await supabase
    .from("treatments")
    .select("*")
    .eq("id", treatmentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!treatment) return { error: "הטיפול לא נמצא" };

  const amount = Number(formData.get("amount") ?? 0);
  const durationMinutes = Number(
    formData.get("duration_minutes") ?? treatment.duration_minutes ?? 30,
  );
  const paymentMethod = String(formData.get("payment_method") ?? "cash") as PaymentMethod;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const productName = String(formData.get("product_name") ?? "").trim();
  const productAmountRaw = String(formData.get("product_amount") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const timeStr = String(formData.get("time") ?? "");

  if (!amount || amount <= 0) return { error: "יש להזין סכום תקין" };

  const performedAtDate = dateStr && timeStr ? new Date(`${dateStr}T${timeStr}:00`) : new Date();
  if (performedAtDate.getTime() > Date.now() + 60000) {
    return { error: "לא ניתן לתעד טיפול לתאריך או שעה שעדיין לא הגיעו" };
  }
  const performedAt = performedAtDate.toISOString();

  const { data: log, error } = await supabase
    .from("treatment_log")
    .insert({
      user_id: user.id,
      treatment_id: treatment.id,
      treatment_name: treatment.name,
      amount,
      duration_minutes: durationMinutes,
      payment_method: paymentMethod,
      is_paid: true,
      performed_at: performedAt,
      notes,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23502") {
      return {
        error:
          "שגיאה בשמירה — המערכת עדיין לא עודכנה במלואה בשרת. אנא נסי שוב עוד כמה דקות.",
      };
    }
    return { error: "שגיאה בשמירת התיעוד, נסי שוב" };
  }

  if (productName && productAmountRaw) {
    await supabase.from("product_sales").insert({
      user_id: user.id,
      treatment_log_id: log.id,
      product_name: productName,
      amount: Number(productAmountRaw),
      is_paid: true,
      sold_at: performedAt,
    });
  }

  const slug = slugFromCategory(treatment.category as string) ?? "facials";
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath(`/log/${slug}`);
  redirect("/?logged=1");
}

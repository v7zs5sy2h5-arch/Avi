"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveClientId } from "@/lib/clients";

export interface FormActionState {
  error?: string;
}

export async function createProductSale(
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
  const productName = String(formData.get("product_name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const isPaid = formData.get("is_paid") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!productName) return { error: "יש להזין שם מוצר" };
  if (!amount || amount <= 0) return { error: "יש להזין סכום תקין" };

  let finalClientId: string | null = null;
  try {
    finalClientId = await resolveClientId(supabase, user.id, clientId, clientName);
  } catch {
    return { error: "שגיאה בשמירת פרטי הלקוחה" };
  }

  const { error } = await supabase.from("product_sales").insert({
    user_id: user.id,
    client_id: finalClientId,
    product_name: productName,
    amount,
    is_paid: isPaid,
    notes,
  });

  if (error) return { error: "שגיאה בשמירת המכירה" };

  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/payments-pending");
  redirect("/");
}

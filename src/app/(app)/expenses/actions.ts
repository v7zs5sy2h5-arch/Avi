"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FormActionState {
  error?: string;
}

export async function createExpense(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const categoryId = String(formData.get("category_id") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const amount = Number(formData.get("amount") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const spentAt = String(formData.get("spent_at") ?? "");

  if (!amount || amount <= 0) return { error: "יש להזין סכום תקין" };

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    category_id: categoryId,
    description,
    amount,
    notes,
    spent_at: spentAt ? new Date(spentAt).toISOString() : new Date().toISOString(),
  });

  if (error) return { error: "שגיאה בשמירת ההוצאה" };

  revalidatePath("/");
  revalidatePath("/reports");
  redirect("/");
}

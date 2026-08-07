"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function numOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? Number(s) : null;
}

export async function createExpenseCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase.from("expense_categories").insert({
    user_id: user.id,
    name,
    default_amount: numOrNull(formData.get("default_amount")),
  });

  revalidatePath("/settings/expense-categories");
  revalidatePath("/expenses/new");
}

export async function updateExpenseCategory(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase
    .from("expense_categories")
    .update({ name, default_amount: numOrNull(formData.get("default_amount")) })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/settings/expense-categories");
  revalidatePath("/expenses/new");
}

export async function deleteExpenseCategory(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("expense_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/settings/expense-categories");
  revalidatePath("/expenses/new");
}

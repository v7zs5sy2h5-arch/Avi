"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateAll() {
  revalidatePath("/payments-pending");
  revalidatePath("/");
  revalidatePath("/reports");
}

export async function markTreatmentLogPaid(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const amountRaw = String(formData.get("amount") ?? "").trim();
  const update: { is_paid: boolean; amount?: number } = { is_paid: true };
  if (amountRaw) update.amount = Number(amountRaw);

  await supabase
    .from("treatment_log")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateAll();
}

export async function markProductSalePaid(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return;

  const amountRaw = String(formData.get("amount") ?? "").trim();
  const update: { is_paid: boolean; amount?: number } = { is_paid: true };
  if (amountRaw) update.amount = Number(amountRaw);

  await supabase
    .from("product_sales")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateAll();
}

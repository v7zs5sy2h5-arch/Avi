"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function numOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? Number(s) : null;
}

function strOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function createTreatment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("treatments").insert({
    user_id: user.id,
    category: strOrNull(formData.get("category")) ?? "אחר",
    name: strOrNull(formData.get("name")) ?? "טיפול חדש",
    description: strOrNull(formData.get("description")),
    price: numOrNull(formData.get("price")),
    price_note: strOrNull(formData.get("price_note")),
    duration_minutes: numOrNull(formData.get("duration_minutes")),
    is_series: formData.get("is_series") === "on",
    series_size: numOrNull(formData.get("series_size")),
    series_price: numOrNull(formData.get("series_price")),
  });

  revalidatePath("/settings/treatments");
  revalidatePath("/appointments/new");
}

export async function updateTreatment(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("treatments")
    .update({
      category: strOrNull(formData.get("category")) ?? "אחר",
      name: strOrNull(formData.get("name")) ?? "טיפול",
      description: strOrNull(formData.get("description")),
      price: numOrNull(formData.get("price")),
      price_note: strOrNull(formData.get("price_note")),
      duration_minutes: numOrNull(formData.get("duration_minutes")),
      is_series: formData.get("is_series") === "on",
      series_size: numOrNull(formData.get("series_size")),
      series_price: numOrNull(formData.get("series_price")),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/settings/treatments");
  revalidatePath("/appointments/new");
}

export async function deleteTreatment(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("treatments").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/settings/treatments");
  revalidatePath("/appointments/new");
}

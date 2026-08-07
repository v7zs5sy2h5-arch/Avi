"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FormActionState {
  error?: string;
}

export async function saveWeeklyGoal(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "יש להתחבר מחדש" };

  const weekStart = String(formData.get("week_start") ?? "");
  const targetCount = Number(formData.get("target_count") ?? 0);
  const targetRevenue = Number(formData.get("target_revenue") ?? 0);

  if (!weekStart || !targetCount || !targetRevenue) {
    return { error: "יש למלא את כל השדות" };
  }

  const { error } = await supabase.from("weekly_goals").upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      target_count: targetCount,
      target_revenue: targetRevenue,
    },
    { onConflict: "user_id,week_start" },
  );

  if (error) return { error: "שגיאה בשמירת היעד" };

  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/settings/goal");
  redirect("/");
}

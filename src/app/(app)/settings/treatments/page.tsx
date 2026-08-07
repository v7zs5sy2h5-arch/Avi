import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { TreatmentRow } from "./TreatmentRow";
import { AddTreatmentForm } from "./AddTreatmentForm";
import type { Treatment } from "@/types/database";

export default async function TreatmentsSettingsPage() {
  const supabase = await createClient();
  const { data: treatments } = await supabase
    .from("treatments")
    .select("*")
    .order("sort_order")
    .returns<Treatment[]>();

  const grouped = new Map<string, Treatment[]>();
  for (const t of treatments ?? []) {
    grouped.set(t.category, [...(grouped.get(t.category) ?? []), t]);
  }
  const categories = Array.from(grouped.keys());

  return (
    <div className="px-4">
      <Header title="ניהול מחירון" />
      <div className="mt-4 space-y-5 pb-8">
        {Array.from(grouped.entries()).map(([category, list]) => (
          <div key={category}>
            <p className="mb-2 text-sm text-text-muted">{category}</p>
            <div className="space-y-2">
              {list.map((t) => (
                <TreatmentRow key={t.id} treatment={t} />
              ))}
            </div>
          </div>
        ))}
        <AddTreatmentForm categories={categories} />
      </div>
    </div>
  );
}

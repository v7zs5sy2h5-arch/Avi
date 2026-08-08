import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { categoryFromSlug, getCategoryStyle, getTreatmentEmoji } from "@/lib/categoryStyle";
import { LogTreatmentForm } from "./LogTreatmentForm";
import type { Treatment } from "@/types/database";

export default async function LogTreatmentPage({
  params,
}: {
  params: Promise<{ category: string; treatmentId: string }>;
}) {
  const { category: slug, treatmentId } = await params;
  const category = categoryFromSlug(slug);
  if (!category) notFound();

  const supabase = await createClient();
  const { data: treatment } = await supabase
    .from("treatments")
    .select("*")
    .eq("id", treatmentId)
    .maybeSingle<Treatment>();

  if (!treatment) notFound();

  const style = getCategoryStyle(category);
  const emoji = getTreatmentEmoji(treatment.name, category);

  return (
    <div>
      <Header title={`${emoji} ${treatment.name}`} />
      <div className="px-4 pt-3">
        <div className={`rounded-2xl ${style.bg} ${style.text} px-4 py-3 text-sm font-semibold`}>
          {treatment.name}
          {treatment.description ? (
            <span className="mt-1 block text-sm font-normal opacity-80">
              {treatment.description}
            </span>
          ) : null}
        </div>
      </div>
      <LogTreatmentForm treatment={treatment} categorySlug={slug} />
    </div>
  );
}

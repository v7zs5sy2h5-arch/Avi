import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { Client } from "@/types/database";
import { ClientInfoForm } from "./ClientInfoForm";

interface HistoryRow {
  id: string;
  starts_at: string;
  status: "planned" | "completed" | "cancelled" | "no_show";
  treatment: { name: string } | { name: string }[] | null;
  treatment_name_freetext: string | null;
  treatment_log: { amount: number; is_paid: boolean }[] | { amount: number; is_paid: boolean } | null;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: history }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>(),
    supabase
      .from("appointments")
      .select("id, starts_at, status, treatment:treatments(name), treatment_name_freetext, treatment_log(amount, is_paid)")
      .eq("client_id", id)
      .order("starts_at", { ascending: false })
      .returns<HistoryRow[]>(),
  ]);

  if (!client) notFound();

  return (
    <div className="px-4">
      <Header title="פרטי לקוחה 👤" />
      <div className="mt-3">
        <ClientInfoForm client={client} />
      </div>

      <p className="mt-5 mb-2 text-sm font-semibold text-text">📋 היסטוריית תורים</p>
      <div className="space-y-2 pb-8">
        {(history ?? []).map((h) => {
          const treatmentName = Array.isArray(h.treatment)
            ? h.treatment[0]?.name
            : h.treatment?.name;
          const log = Array.isArray(h.treatment_log) ? h.treatment_log[0] : h.treatment_log;
          return (
            <Link
              key={h.id}
              href={`/appointments/${h.id}`}
              className="card-interactive flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-3.5 shadow-sm shadow-black/[0.03]"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] font-semibold">
                  {treatmentName ?? h.treatment_name_freetext}
                </p>
                <p className="text-sm text-text-muted">
                  {formatDate(h.starts_at)} · {formatTime(h.starts_at)}
                  {log ? ` · ${formatCurrency(log.amount)}` : ""}
                  {log && !log.is_paid ? " · ממתין לתשלום" : ""}
                </p>
              </div>
              <StatusBadge status={h.status} />
            </Link>
          );
        })}
        {(!history || history.length === 0) && (
          <p className="py-6 text-center text-sm text-text-muted">אין עדיין תורים</p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Field";
import { AddClientForm } from "./AddClientForm";
import type { Client } from "@/types/database";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clients").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: clients } = await query.returns<Client[]>();

  return (
    <div className="px-4">
      <Header title="לקוחות" />

      <form className="mt-3" method="get">
        <div className="relative">
          <Search
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="חיפוש לקוחה..."
            className="pr-10"
          />
        </div>
      </form>

      <div className="mt-3 space-y-2 pb-8">
        {(clients ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-3.5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[15px]">{c.name}</p>
              {c.phone ? <p className="text-sm text-text-muted">{c.phone}</p> : null}
            </div>
            <ChevronLeft size={18} className="text-text-muted" />
          </Link>
        ))}
        {(!clients || clients.length === 0) && (
          <p className="py-8 text-center text-sm text-text-muted">אין לקוחות עדיין</p>
        )}
        <AddClientForm />
      </div>
    </div>
  );
}

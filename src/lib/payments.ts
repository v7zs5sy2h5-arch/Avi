import type { SupabaseClient } from "@supabase/supabase-js";

export interface PendingItem {
  id: string;
  kind: "treatment" | "product";
  clientName: string;
  itemLabel: string;
  amount: number;
  date: string;
}

export async function getPendingPayments(
  supabase: SupabaseClient,
): Promise<PendingItem[]> {
  const [{ data: logs }, { data: sales }] = await Promise.all([
    supabase
      .from("treatment_log")
      .select("id, amount, performed_at, treatment_name, client:clients(name)")
      .eq("is_paid", false)
      .order("performed_at"),
    supabase
      .from("product_sales")
      .select("id, amount, sold_at, product_name, client:clients(name)")
      .eq("is_paid", false)
      .order("sold_at"),
  ]);

  const items: PendingItem[] = [
    ...(logs ?? []).map(
      (l: {
        id: string;
        amount: number;
        performed_at: string;
        treatment_name: string;
        client: { name: string } | { name: string }[] | null;
      }) => ({
        id: l.id,
        kind: "treatment" as const,
        clientName: Array.isArray(l.client)
          ? (l.client[0]?.name ?? "לא ידוע")
          : (l.client?.name ?? "לא ידוע"),
        itemLabel: l.treatment_name,
        amount: l.amount,
        date: l.performed_at,
      }),
    ),
    ...(sales ?? []).map(
      (s: {
        id: string;
        amount: number;
        sold_at: string;
        product_name: string;
        client: { name: string } | { name: string }[] | null;
      }) => ({
        id: s.id,
        kind: "product" as const,
        clientName: Array.isArray(s.client)
          ? (s.client[0]?.name ?? "לקוחה מזדמנת")
          : (s.client?.name ?? "לקוחה מזדמנת"),
        itemLabel: s.product_name,
        amount: s.amount,
        date: s.sold_at,
      }),
    ),
  ];

  return items.sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ExpenseForm } from "./ExpenseForm";

export default async function NewExpensePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("expense_categories")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <Header title="הוספת הוצאה" />
      <ExpenseForm categories={categories ?? []} />
    </div>
  );
}

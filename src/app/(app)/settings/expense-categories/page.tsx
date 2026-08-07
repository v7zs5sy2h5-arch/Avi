import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { CategoryRow } from "./CategoryRow";
import { AddCategoryForm } from "./AddCategoryForm";
import type { ExpenseCategory } from "@/types/database";

export default async function ExpenseCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("expense_categories")
    .select("*")
    .order("sort_order")
    .returns<ExpenseCategory[]>();

  return (
    <div className="px-4">
      <Header title="קטגוריות הוצאה" />
      <div className="mt-4 space-y-2 pb-8">
        {(categories ?? []).map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
        <AddCategoryForm />
      </div>
    </div>
  );
}

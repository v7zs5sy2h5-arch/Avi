import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ProductSaleForm } from "./ProductSaleForm";

export default async function NewProductSalePage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  return (
    <div>
      <Header title="מכירת מוצר 🛍️" />
      <ProductSaleForm clients={clients ?? []} />
    </div>
  );
}

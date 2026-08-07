import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPendingPayments } from "@/lib/payments";
import { markTreatmentLogPaid, markProductSalePaid } from "./actions";

export default async function PaymentsPendingPage() {
  const supabase = await createClient();
  const items = await getPendingPayments(supabase);
  const total = items.reduce((sum, i) => sum + i.amount, 0);

  const byClient = new Map<string, typeof items>();
  for (const item of items) {
    byClient.set(item.clientName, [...(byClient.get(item.clientName) ?? []), item]);
  }

  return (
    <div className="px-4">
      <Header title="תשלומים ממתינים ⏳" />

      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-muted">
          אין תשלומים ממתינים כרגע 🎉
        </p>
      ) : (
        <>
          <Card className="mt-4 flex items-center justify-between">
            <span className="text-text-muted text-sm">💰 סה&quot;כ ממתין</span>
            <span className="text-lg font-bold text-warning">
              {formatCurrency(total)}
            </span>
          </Card>

          <div className="mt-4 space-y-4 pb-8">
            {Array.from(byClient.entries()).map(([clientName, list]) => (
              <div key={clientName}>
                <p className="mb-1.5 text-sm font-semibold text-text">
                  👤 {clientName}
                </p>
                <div className="space-y-2">
                  {list.map((item) => {
                    const action =
                      item.kind === "treatment"
                        ? markTreatmentLogPaid.bind(null, item.id)
                        : markProductSalePaid.bind(null, item.id);
                    return (
                      <Card
                        key={item.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px]">{item.itemLabel}</p>
                          <p className="text-sm text-text-muted">
                            {formatDate(item.date)}
                          </p>
                        </div>
                        <form
                          action={action}
                          className="flex items-center gap-2 shrink-0"
                        >
                          <Input
                            type="number"
                            name="amount"
                            defaultValue={item.amount}
                            min="0"
                            className="h-10 w-20 px-2 text-center"
                          />
                          <Button type="submit" size="sm">
                            שולם
                          </Button>
                        </form>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

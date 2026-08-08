"use client";

import { useActionState, useState } from "react";
import { logTreatment } from "../../actions";
import type { LogState } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/types/database";
import type { PaymentMethod, Treatment } from "@/types/database";

const initialState: LogState = {};
const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "bit", "transfer"];

export function LogTreatmentForm({
  treatment,
  categorySlug,
}: {
  treatment: Treatment;
  categorySlug: string;
}) {
  const action = logTreatment.bind(null, treatment.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [showProduct, setShowProduct] = useState(false);

  return (
    <form action={formAction} className="space-y-6 px-4 pb-6 pt-5">
      <input type="hidden" name="payment_method" value={paymentMethod} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">מחיר (₪)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0"
            defaultValue={treatment.price ?? ""}
            required
            className="h-14 text-lg font-bold"
          />
        </div>
        <div>
          <Label htmlFor="duration_minutes">משך (דקות)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            inputMode="numeric"
            min="5"
            step="5"
            defaultValue={treatment.duration_minutes ?? 30}
            required
            className="h-14 text-lg font-bold"
          />
        </div>
      </div>

      <div>
        <Label>אמצעי תשלום</Label>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={cn(
                "flex h-16 flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-colors",
                paymentMethod === method
                  ? "gradient-primary text-accent-foreground shadow-sm shadow-accent/25"
                  : "bg-surface-soft text-text-muted",
              )}
            >
              {PAYMENT_METHOD_LABELS[method]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowProduct((v) => !v)}
        className="text-sm font-semibold text-accent-strong underline underline-offset-2"
      >
        {showProduct ? "− הסרת מכירת מוצר" : "+ נמכר גם מוצר באותה פגישה?"}
      </button>

      {showProduct ? (
        <div className="space-y-3 rounded-2xl bg-surface-soft p-3">
          <div>
            <Label htmlFor="product_name">שם המוצר</Label>
            <Input id="product_name" name="product_name" />
          </div>
          <div>
            <Label htmlFor="product_amount">מחיר המוצר (₪)</Label>
            <Input id="product_amount" name="product_amount" type="number" min="0" />
          </div>
        </div>
      ) : null}

      <div>
        <Label htmlFor="notes">הערות (אופציונלי)</Label>
        <Textarea id="notes" name="notes" />
      </div>

      {state?.error ? <p className="text-sm text-warning">{state.error}</p> : null}

      <Button type="submit" size="lg" className="w-full h-16 text-lg" disabled={pending}>
        {pending ? "שומרת..." : "✅ תיעוד הטיפול"}
      </Button>

      <a
        href={`/log/${categorySlug}`}
        className="block text-center text-sm text-text-muted underline underline-offset-2"
      >
        ביטול, חזרה לרשימה
      </a>
    </form>
  );
}

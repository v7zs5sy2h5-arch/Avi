"use client";

import { useActionState } from "react";
import { createProductSale } from "../actions";
import type { FormActionState } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Checkbox } from "@/components/ui/Field";

const initialState: FormActionState = {};

export function ProductSaleForm() {
  const [state, formAction, pending] = useActionState(
    createProductSale,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5 px-4 pb-6">
      <div>
        <Label htmlFor="product_name">שם המוצר</Label>
        <Input id="product_name" name="product_name" required />
      </div>

      <div>
        <Label htmlFor="amount">סכום (₪)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0"
          required
        />
      </div>

      <Checkbox name="is_paid" label="שולם" defaultChecked />

      <div>
        <Label htmlFor="notes">הערות</Label>
        <Textarea id="notes" name="notes" />
      </div>

      {state?.error ? (
        <p className="text-sm text-warning">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "שומרת..." : "שמירת מכירה"}
      </Button>
    </form>
  );
}

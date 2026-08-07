"use client";

import { useActionState, useState } from "react";
import { completeAppointment } from "./actions";
import type { CompleteState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { PAYMENT_METHOD_LABELS } from "@/types/database";
import type { AppointmentWithRelations } from "@/types/database";

const initialState: CompleteState = {};

export function CompleteForm({
  appointment,
}: {
  appointment: AppointmentWithRelations;
}) {
  const action = completeAppointment.bind(null, appointment.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [addProduct, setAddProduct] = useState(false);

  const treatmentName =
    appointment.treatment?.name ?? appointment.treatment_name_freetext;

  return (
    <form action={formAction} className="space-y-5 px-4 pb-6">
      <Card>
        <p className="text-sm text-text-muted">{appointment.client?.name}</p>
        <p className="text-lg font-medium">{treatmentName}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">סכום ששולם (₪)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            defaultValue={appointment.expected_price ?? appointment.treatment?.price ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration_minutes">משך בפועל (דקות)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min="5"
            step="5"
            defaultValue={appointment.duration_minutes}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="payment_method">אמצעי תשלום</Label>
        <Select id="payment_method" name="payment_method" defaultValue="cash">
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <Checkbox name="is_paid" label="שולם" defaultChecked />

      <div className="rounded-2xl border border-border-soft p-3.5">
        <Checkbox
          label="הוסיפי מכירת מוצר?"
          checked={addProduct}
          onChange={(e) => setAddProduct(e.target.checked)}
        />
        {addProduct ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product_name">שם המוצר</Label>
              <Input id="product_name" name="product_name" />
            </div>
            <div>
              <Label htmlFor="product_amount">סכום (₪)</Label>
              <Input
                id="product_amount"
                name="product_amount"
                type="number"
                min="0"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="notes">הערות</Label>
        <Textarea id="notes" name="notes" />
      </div>

      {state?.error ? (
        <p className="text-sm text-warning">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "שומרת..." : "אישור ושמירה"}
      </Button>
    </form>
  );
}

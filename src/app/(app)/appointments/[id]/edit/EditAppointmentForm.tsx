"use client";

import { useActionState } from "react";
import { updateAppointment } from "../../actions";
import type { FormActionState } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import type { Appointment } from "@/types/database";
import { isoDate } from "@/lib/dates";

const initialState: FormActionState = {};

export function EditAppointmentForm({
  appointment,
}: {
  appointment: Appointment;
}) {
  const action = updateAppointment.bind(null, appointment.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const start = new Date(appointment.starts_at);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <form action={formAction} className="space-y-5 px-4 pb-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">תאריך</Label>
          <Input
            id="date"
            type="date"
            name="date"
            defaultValue={isoDate(start)}
            required
          />
        </div>
        <div>
          <Label htmlFor="time">שעה</Label>
          <Input
            id="time"
            type="time"
            name="time"
            defaultValue={`${pad(start.getHours())}:${pad(start.getMinutes())}`}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">מחיר משוער (₪)</Label>
          <Input
            id="price"
            type="number"
            name="price"
            min="0"
            defaultValue={appointment.expected_price ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="duration_minutes">משך (דקות)</Label>
          <Input
            id="duration_minutes"
            type="number"
            name="duration_minutes"
            min="5"
            step="5"
            defaultValue={appointment.duration_minutes}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">הערות</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={appointment.notes ?? ""}
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-warning">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "שומרת..." : "עדכון תור"}
      </Button>
    </form>
  );
}

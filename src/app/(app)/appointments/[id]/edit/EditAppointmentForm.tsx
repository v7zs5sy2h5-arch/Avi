"use client";

import { useActionState, useState } from "react";
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
  const [date, setDate] = useState(isoDate(start));
  const [time, setTime] = useState(`${pad(start.getHours())}:${pad(start.getMinutes())}`);

  const isPast =
    appointment.status === "planned" &&
    new Date(`${date}T${time}:00`).getTime() < new Date().getTime();

  return (
    <form action={formAction} className="space-y-5 px-4 pb-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">תאריך</Label>
          <Input
            id="date"
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="time">שעה</Label>
          <Input
            id="time"
            type="time"
            name="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>
      {isPast ? (
        <p className="text-sm text-warning font-medium -mt-3">
          ⚠️ לא ניתן לקבוע תור לתאריך או שעה שכבר עברו
        </p>
      ) : null}

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

      <Button type="submit" size="lg" className="w-full" disabled={pending || isPast}>
        {pending ? "שומרת..." : "עדכון תור"}
      </Button>
    </form>
  );
}

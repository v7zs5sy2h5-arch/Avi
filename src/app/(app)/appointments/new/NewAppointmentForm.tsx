"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createAppointment } from "../actions";
import type { FormActionState } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Checkbox } from "@/components/ui/Field";
import { ClientAutocomplete } from "@/components/ClientAutocomplete";
import { TreatmentPicker } from "@/components/TreatmentPicker";
import type { Client, Treatment } from "@/types/database";

const initialState: FormActionState = {};

function nowParts() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(Math.ceil(now.getMinutes() / 5) * 5 === 60 ? 0 : Math.ceil(now.getMinutes() / 5) * 5)}`,
  };
}

export function NewAppointmentForm({
  clients,
  treatments,
}: {
  clients: Client[];
  treatments: Treatment[];
}) {
  const [state, formAction, pending] = useActionState(
    createAppointment,
    initialState,
  );
  const searchParams = useSearchParams();
  const initial = nowParts();
  const [date, setDate] = useState(searchParams.get("date") ?? initial.date);
  const [time, setTime] = useState(searchParams.get("time") ?? initial.time);
  const [retroactive, setRetroactive] = useState(false);

  function setNow() {
    const n = nowParts();
    setDate(n.date);
    setTime(n.time);
  }

  return (
    <form action={formAction} className="space-y-6 px-4 pb-6">
      <ClientAutocomplete clients={clients} />

      <TreatmentPicker treatments={treatments} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>תאריך ושעה</Label>
          <button
            type="button"
            onClick={setNow}
            className="text-sm text-accent-strong underline underline-offset-2"
          >
            עכשיו
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            type="time"
            name="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      <Checkbox
        name="mark_completed"
        label="הטיפול כבר התבצע — לתעד ולסמן ישירות כ'הושלם'"
        checked={retroactive}
        onChange={(e) => setRetroactive(e.target.checked)}
      />
      {retroactive ? (
        <p className="text-sm text-text-muted -mt-3">
          לאחר השמירה יפתח טופס אישור הכנסה למילוי פרטי התשלום.
        </p>
      ) : null}

      <div>
        <Label htmlFor="notes">הערות (אופציונלי)</Label>
        <Textarea id="notes" name="notes" />
      </div>

      {state?.error ? (
        <p className="text-sm text-warning">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "שומרת..." : "שמירת תור"}
      </Button>
    </form>
  );
}

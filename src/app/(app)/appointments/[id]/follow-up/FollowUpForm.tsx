"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createFollowUps } from "./actions";
import type { FollowUpState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

const initialState: FollowUpState = {};

export function FollowUpForm({
  appointmentId,
  isSeries,
  seriesSize,
}: {
  appointmentId: string;
  isSeries: boolean;
  seriesSize: number | null;
}) {
  const action = createFollowUps.bind(null, appointmentId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [interval, setInterval] = useState(isSeries ? "14" : "21");
  const quickOptions = isSeries ? [7, 14, 21] : [14, 21, 28];

  return (
    <form action={formAction} className="space-y-5 px-4 pb-6">
      <p className="text-sm text-text-muted">
        {isSeries
          ? `לקבוע מראש את שאר מפגשי הסדרה (${(seriesSize ?? 1) - 1} תורים נוספים)?`
          : "לקבוע תור המשך לציפורניים?"}
      </p>

      <div>
        <Label htmlFor="interval_days">מרווח בימים בין התורים</Label>
        <div className="flex gap-2 mb-2">
          {quickOptions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setInterval(String(d))}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm",
                interval === String(d)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border-soft text-text-muted",
              )}
            >
              {d} ימים
            </button>
          ))}
        </div>
        <Input
          id="interval_days"
          name="interval_days"
          type="number"
          min="1"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          required
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-warning">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "קובעת..." : "קביעת תור המשך"}
      </Button>
      <Link
        href={`/appointments/${appointmentId}`}
        className="block text-center text-sm text-text-muted"
      >
        לא כרגע
      </Link>
    </form>
  );
}

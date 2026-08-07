"use client";

import { useActionState } from "react";
import { saveWeeklyGoal } from "./actions";
import type { FormActionState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

const initialState: FormActionState = {};

export function GoalForm({
  weekStartIso,
  suggestedCount,
  suggestedRevenue,
}: {
  weekStartIso: string;
  suggestedCount: number;
  suggestedRevenue: number;
}) {
  const [state, formAction, pending] = useActionState(saveWeeklyGoal, initialState);

  return (
    <form action={formAction} className="space-y-5 px-4 pb-6">
      <input type="hidden" name="week_start" value={weekStartIso} />
      <div>
        <Label htmlFor="target_count">יעד כמות טיפולי פנים</Label>
        <Input
          id="target_count"
          name="target_count"
          type="number"
          min="1"
          defaultValue={suggestedCount || ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="target_revenue">יעד הכנסה (₪)</Label>
        <Input
          id="target_revenue"
          name="target_revenue"
          type="number"
          min="1"
          defaultValue={suggestedRevenue || ""}
          required
        />
      </div>
      {state?.error ? <p className="text-sm text-warning">{state.error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "שומרת..." : "שמירת יעד"}
      </Button>
    </form>
  );
}

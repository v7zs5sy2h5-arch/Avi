"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <div>
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          className="text-right"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          className="text-right"
          required
        />
      </div>
      {state?.error ? <ErrorBanner message={state.error} /> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "מתחברת..." : "כניסה"}
      </Button>
    </form>
  );
}

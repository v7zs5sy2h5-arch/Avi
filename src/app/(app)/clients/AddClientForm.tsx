"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { createClientRecord } from "./actions";

export function AddClientForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={18} />
        לקוחה חדשה
      </Button>
    );
  }

  return (
    <Card>
      <form
        ref={formRef}
        action={async (formData) => {
          await createClientRecord(formData);
          formRef.current?.reset();
          setOpen(false);
        }}
        className="space-y-3"
      >
        <div>
          <Label htmlFor="new-client-name">שם</Label>
          <Input id="new-client-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="new-client-phone">טלפון (אופציונלי)</Label>
          <Input id="new-client-phone" name="phone" dir="ltr" className="text-right" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            הוספה
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
            ביטול
          </Button>
        </div>
      </form>
    </Card>
  );
}

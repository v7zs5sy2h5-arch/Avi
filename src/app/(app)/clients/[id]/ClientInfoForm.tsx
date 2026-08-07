"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { updateClientRecord } from "../actions";
import type { Client } from "@/types/database";

export function ClientInfoForm({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);
  const updateAction = updateClientRecord.bind(null, client.id);

  if (!editing) {
    return (
      <Card className="flex items-start justify-between">
        <div>
          <p className="text-lg font-medium">{client.name}</p>
          {client.phone ? <p className="text-sm text-text-muted">{client.phone}</p> : null}
          {client.notes ? (
            <p className="mt-2 text-sm text-text-muted">{client.notes}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full p-2 text-text-muted hover:bg-surface-soft"
          aria-label="עריכה"
        >
          <Pencil size={18} />
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <form action={updateAction} className="space-y-3">
        <div>
          <Label htmlFor="client-name">שם</Label>
          <Input id="client-name" name="name" defaultValue={client.name} required />
        </div>
        <div>
          <Label htmlFor="client-phone">טלפון</Label>
          <Input
            id="client-phone"
            name="phone"
            defaultValue={client.phone ?? ""}
            dir="ltr"
            className="text-right"
          />
        </div>
        <div>
          <Label htmlFor="client-notes">הערות</Label>
          <Textarea id="client-notes" name="notes" defaultValue={client.notes ?? ""} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" onClick={() => setEditing(false)}>
            שמירה
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
            ביטול
          </Button>
        </div>
      </form>
    </Card>
  );
}

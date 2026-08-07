"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/utils";
import { updateExpenseCategory, deleteExpenseCategory } from "./actions";
import type { ExpenseCategory } from "@/types/database";

export function CategoryRow({ category }: { category: ExpenseCategory }) {
  const [editing, setEditing] = useState(false);
  const updateAction = updateExpenseCategory.bind(null, category.id);
  const deleteAction = deleteExpenseCategory.bind(null, category.id);

  if (!editing) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[15px]">{category.name}</p>
          {category.default_amount != null ? (
            <p className="text-sm text-text-muted">
              סכום מוצע: {formatCurrency(category.default_amount)}
            </p>
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
          <Label htmlFor={`cat-name-${category.id}`}>שם קטגוריה</Label>
          <Input id={`cat-name-${category.id}`} name="name" defaultValue={category.name} required />
        </div>
        <div>
          <Label htmlFor={`cat-amount-${category.id}`}>סכום מוצע (₪, אופציונלי)</Label>
          <Input
            id={`cat-amount-${category.id}`}
            name="default_amount"
            type="number"
            min="0"
            defaultValue={category.default_amount ?? ""}
          />
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
      <form action={deleteAction} className="mt-2">
        <Button type="submit" variant="ghost" size="sm" className="text-warning">
          <Trash2 size={16} />
          מחיקה
        </Button>
      </form>
    </Card>
  );
}

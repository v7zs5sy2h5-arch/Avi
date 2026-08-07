"use client";

import { useMemo, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Input, Label } from "@/components/ui/Field";
import type { Treatment } from "@/types/database";

const OTHER_ID = "__other__";

export function TreatmentPicker({ treatments }: { treatments: Treatment[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [price, setPrice] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [otherName, setOtherName] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, Treatment[]>();
    for (const t of treatments) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return Array.from(map.entries());
  }, [treatments]);

  function selectTreatment(t: Treatment) {
    setSelectedId(t.id);
    setPrice(t.price != null ? String(t.price) : "");
    setDuration(t.duration_minutes != null ? String(t.duration_minutes) : "");
  }

  function selectOther() {
    setSelectedId(OTHER_ID);
    setPrice("");
    setDuration("");
  }

  const isOther = selectedId === OTHER_ID;

  return (
    <div className="space-y-4">
      <input
        type="hidden"
        name="treatment_id"
        value={isOther || !selectedId ? "" : selectedId}
      />
      <div>
        <Label>טיפול</Label>
        <div className="space-y-4">
          {grouped.map(([category, list]) => (
            <div key={category}>
              <p className="text-sm text-text-muted mb-2">{category}</p>
              <div className="grid grid-cols-2 gap-2">
                {list.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTreatment(t)}
                    className={cn(
                      "rounded-xl border p-3 text-right transition-colors",
                      selectedId === t.id
                        ? "border-accent bg-accent/10"
                        : "border-border-soft bg-bg hover:bg-surface-soft",
                    )}
                  >
                    <div className="text-[15px] leading-snug">{t.name}</div>
                    <div className="mt-1 text-sm text-text-muted">
                      {t.price != null
                        ? formatCurrency(t.price)
                        : t.price_note ?? "מחיר לעריכה"}
                      {t.duration_minutes != null
                        ? ` · ${t.duration_minutes} דק'`
                        : ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={selectOther}
            className={cn(
              "w-full rounded-xl border p-3 text-right transition-colors",
              isOther
                ? "border-accent bg-accent/10"
                : "border-border-soft bg-bg hover:bg-surface-soft",
            )}
          >
            <div className="text-[15px]">אחר (טיפול חופשי)</div>
          </button>
        </div>
      </div>

      {isOther ? (
        <div>
          <Label htmlFor="treatment_name_freetext">שם הטיפול</Label>
          <Input
            id="treatment_name_freetext"
            name="treatment_name_freetext"
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
            required
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">מחיר (₪)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration_minutes">משך (דקות)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            inputMode="numeric"
            step="5"
            min="5"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}

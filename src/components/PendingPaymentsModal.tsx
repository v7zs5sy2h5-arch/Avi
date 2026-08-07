"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markTreatmentLogPaid, markProductSalePaid } from "@/app/(app)/payments-pending/actions";
import type { PendingItem } from "@/lib/payments";

const SESSION_KEY = "ka-pending-payments-dismissed";

export function PendingPaymentsModal({ items }: { items: PendingItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    // Reading a browser-only external store (sessionStorage) after mount to
    // decide whether to reveal the modal; this can't be derived at render
    // time on the server, so an effect is the correct tool here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, [items.length]);

  function close() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  }

  if (items.length === 0) return null;

  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const preview = items.slice(0, 4);

  return (
    <Modal open={open} onClose={close} title="תשלומים ממתינים">
      <p className="text-sm text-text-muted mb-3">
        יש לך {items.length} תשלומים ממתינים בסך{" "}
        <span className="font-medium text-warning">{formatCurrency(total)}</span>
      </p>

      <div className="space-y-2 mb-4">
        {preview.map((item) => {
          const action =
            item.kind === "treatment"
              ? markTreatmentLogPaid.bind(null, item.id)
              : markProductSalePaid.bind(null, item.id);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface-soft px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.clientName}</p>
                <p className="truncate text-sm text-text-muted">
                  {item.itemLabel} · {formatDate(item.date)} ·{" "}
                  {formatCurrency(item.amount)}
                </p>
              </div>
              <form action={action}>
                <Button type="submit" size="sm" variant="secondary">
                  סמן כשולם
                </Button>
              </form>
            </div>
          );
        })}
        {items.length > preview.length ? (
          <p className="text-sm text-text-muted text-center">
            ועוד {items.length - preview.length} תשלומים...
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={close} className="flex-1">
          לא כרגע
        </Button>
        <Link
          href="/payments-pending"
          onClick={close}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 h-12 text-[15px] font-medium text-accent-foreground"
        >
          צפייה בהכל
        </Link>
      </div>
    </Modal>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { Input, Label } from "@/components/ui/Field";
import type { Client } from "@/types/database";

export function ClientAutocomplete({
  clients,
  defaultClient,
  required = true,
  label = "לקוחה",
}: {
  clients: Client[];
  defaultClient?: Client | null;
  required?: boolean;
  label?: string;
}) {
  const [query, setQuery] = useState(defaultClient?.name ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultClient?.id ?? null,
  );
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.slice(0, 8);
    return clients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, clients]);

  const exactMatch = clients.find(
    (c) => c.name.trim().toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <div className="relative">
      <Label htmlFor="client_query">{label}</Label>
      <Input
        id="client_query"
        value={query}
        required={required}
        placeholder="הקלידי שם לקוחה..."
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 120);
        }}
      />
      <input type="hidden" name="client_id" value={selectedId ?? ""} />
      <input type="hidden" name="client_name" value={query.trim()} />

      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-bg shadow-lg max-h-56 overflow-y-auto">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-right text-[15px] hover:bg-surface-soft"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (blurTimeout.current) clearTimeout(blurTimeout.current);
                  setQuery(c.name);
                  setSelectedId(c.id);
                  setOpen(false);
                }}
              >
                {c.name}
                {c.phone ? (
                  <span className="text-text-muted text-sm mr-2">
                    {c.phone}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && !exactMatch && !selectedId ? (
        <p className="mt-1 text-sm text-accent-strong">
          תיווצר לקוחה חדשה בשם &ldquo;{query.trim()}&rdquo;
        </p>
      ) : null}
    </div>
  );
}

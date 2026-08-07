// Minimal Supabase-JS-compatible fake query builder, backed by the
// in-memory store in ./store.ts. Implements exactly the subset of the
// chainable query API this app actually uses (see grep audit): select
// with embedded relations, eq/gte/lt/lte/gt/in/ilike filters, order,
// limit, maybeSingle/single, insert/update/delete/upsert, and enough of
// the appointments-overlap / treatment_log-uniqueness business rules to
// exercise the same error paths the real Postgres constraints produce.

import { getStore, LOCAL_USER_ID, type Row, type Store } from "./store";

type TableName = keyof Store;

interface Filter {
  type: "eq" | "gte" | "lt" | "lte" | "gt" | "in" | "ilike";
  col: string;
  val: unknown;
}

interface RelationDef {
  table: TableName;
  type: "one" | "many";
  localKey: string;
  foreignKey: string;
}

const RELATIONS: Partial<Record<TableName, Record<string, RelationDef>>> = {
  appointments: {
    client: { table: "clients", type: "one", localKey: "client_id", foreignKey: "id" },
    treatment: { table: "treatments", type: "one", localKey: "treatment_id", foreignKey: "id" },
    treatment_log: { table: "treatment_log", type: "many", localKey: "id", foreignKey: "appointment_id" },
  },
  treatment_log: {
    client: { table: "clients", type: "one", localKey: "client_id", foreignKey: "id" },
    treatment: { table: "treatments", type: "one", localKey: "treatment_id", foreignKey: "id" },
  },
  product_sales: {
    client: { table: "clients", type: "one", localKey: "client_id", foreignKey: "id" },
  },
  expenses: {
    category: { table: "expense_categories", type: "one", localKey: "category_id", foreignKey: "id" },
  },
};

function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of str) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function parseSelect(str: string): { cols: string[]; embeds: { alias: string; sub: string }[] } {
  const cols: string[] = [];
  const embeds: { alias: string; sub: string }[] = [];
  for (const token of splitTopLevel(str)) {
    const aliased = token.match(/^(\w+):(\w+)\(([\s\S]*)\)$/);
    const plain = token.match(/^(\w+)\(([\s\S]*)\)$/);
    if (aliased) {
      embeds.push({ alias: aliased[1], sub: aliased[3] });
    } else if (plain) {
      embeds.push({ alias: plain[1], sub: plain[2] });
    } else if (token) {
      cols.push(token);
    }
  }
  return { cols, embeds };
}

function project(row: Row, table: TableName, selectStr: string): Row {
  const { cols, embeds } = parseSelect(selectStr || "*");
  const result: Row = {};
  if (cols.length === 0 || cols.includes("*")) {
    Object.assign(result, row);
  }
  for (const col of cols) {
    if (col !== "*") result[col] = row[col];
  }
  for (const embed of embeds) {
    const relDef = RELATIONS[table]?.[embed.alias];
    if (!relDef) continue;
    const store = getStore();
    const relatedRows = store[relDef.table];
    if (relDef.type === "one") {
      const found = relatedRows.find((r) => r[relDef.foreignKey] === row[relDef.localKey]);
      result[embed.alias] = found ? project(found, relDef.table, embed.sub || "*") : null;
    } else {
      const found = relatedRows.filter((r) => r[relDef.foreignKey] === row[relDef.localKey]);
      result[embed.alias] = found.map((r) => project(r, relDef.table, embed.sub || "*"));
    }
  }
  return result;
}

function ilikeToRegex(pattern: string): RegExp {
  const escaped = pattern
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/%/g, ".*")
    .replace(/_/g, ".");
  return new RegExp(`^${escaped}$`);
}

function matchesFilter(row: Row, f: Filter): boolean {
  const v = row[f.col];
  switch (f.type) {
    case "eq":
      return v === f.val;
    case "in":
      return Array.isArray(f.val) && (f.val as unknown[]).includes(v);
    case "ilike":
      return ilikeToRegex(String(f.val)).test(String(v ?? "").toLowerCase());
    case "gte":
    case "gt":
    case "lt":
    case "lte": {
      if (v == null) return false;
      const a = String(v);
      const b = String(f.val);
      const cmp = a < b ? -1 : a > b ? 1 : 0;
      if (f.type === "gte") return cmp >= 0;
      if (f.type === "gt") return cmp > 0;
      if (f.type === "lt") return cmp < 0;
      return cmp <= 0;
    }
  }
}

function intervalsOverlap(a: Row, b: Row): boolean {
  const occupied = (s: unknown) => s === "planned" || s === "completed";
  if (!occupied(a.status) || !occupied(b.status)) return false;
  const aStart = +new Date(a.starts_at as string);
  const aEnd = aStart + (a.duration_minutes as number) * 60000;
  const bStart = +new Date(b.starts_at as string);
  const bEnd = bStart + (b.duration_minutes as number) * 60000;
  return aStart < bEnd && bStart < aEnd;
}

function findOverlapConflict(candidates: Row[], others: Row[]): boolean {
  for (let i = 0; i < candidates.length; i++) {
    for (const other of others) {
      if (intervalsOverlap(candidates[i], other)) return true;
    }
    for (let j = i + 1; j < candidates.length; j++) {
      if (intervalsOverlap(candidates[i], candidates[j])) return true;
    }
  }
  return false;
}

const OVERLAP_ERROR = { code: "23P01", message: "overlapping appointment" };
const DUPLICATE_ERROR = { code: "23505", message: "duplicate key value" };

type Op = "select" | "insert" | "update" | "delete" | "upsert";

export class LocalQueryBuilder<T = Row> implements PromiseLike<{ data: T | T[] | null; error: { code?: string; message: string } | null }> {
  private table: TableName;
  private op: Op = "select";
  private selectStr = "*";
  private filters: Filter[] = [];
  private orderCol?: string;
  private orderAsc = true;
  private limitN?: number;
  private singleMode?: "single" | "maybeSingle";
  private payload?: Row | Row[];
  private upsertConflict?: string;

  constructor(table: string) {
    this.table = table as TableName;
  }

  select(str = "*") {
    this.selectStr = str;
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push({ type: "eq", col, val });
    return this;
  }
  gte(col: string, val: unknown) {
    this.filters.push({ type: "gte", col, val });
    return this;
  }
  gt(col: string, val: unknown) {
    this.filters.push({ type: "gt", col, val });
    return this;
  }
  lt(col: string, val: unknown) {
    this.filters.push({ type: "lt", col, val });
    return this;
  }
  lte(col: string, val: unknown) {
    this.filters.push({ type: "lte", col, val });
    return this;
  }
  in(col: string, vals: unknown[]) {
    this.filters.push({ type: "in", col, val: vals });
    return this;
  }
  ilike(col: string, pattern: string) {
    this.filters.push({ type: "ilike", col, val: pattern });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }
  single() {
    this.singleMode = "single";
    return this;
  }
  returns<X = T>() {
    return this as unknown as LocalQueryBuilder<X extends unknown[] ? X[number] : X>;
  }

  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  upsert(payload: Row | Row[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = payload;
    this.upsertConflict = opts?.onConflict;
    return this;
  }

  then<TResult1 = { data: T | T[] | null; error: { code?: string; message: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: T | T[] | null; error: { code?: string; message: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<{ data: T | T[] | null; error: { code?: string; message: string } | null }> {
    const store = getStore();
    const table = store[this.table];

    if (this.op === "select") {
      let rows = table.filter((r) => this.filters.every((f) => matchesFilter(r, f)));
      if (this.orderCol) {
        const col = this.orderCol;
        rows = [...rows].sort((a, b) => {
          const av = a[col];
          const bv = b[col];
          if (av === bv) return 0;
          return ((av as string) < (bv as string) ? -1 : 1) * (this.orderAsc ? 1 : -1);
        });
      }
      if (this.limitN != null) rows = rows.slice(0, this.limitN);
      const projected = rows.map((r) => project(r, this.table, this.selectStr)) as T[];
      if (this.singleMode === "maybeSingle") return { data: (projected[0] ?? null) as T | null, error: null };
      if (this.singleMode === "single") {
        if (!projected[0]) return { data: null, error: { message: "No rows found", code: "PGRST116" } };
        return { data: projected[0], error: null };
      }
      return { data: projected, error: null };
    }

    if (this.op === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const now = new Date().toISOString();
      const newRows: Row[] = items.map((item) => ({
        id: (item.id as string) ?? crypto.randomUUID(),
        user_id: LOCAL_USER_ID,
        created_at: now,
        ...item,
      }));

      if (this.table === "appointments") {
        if (findOverlapConflict(newRows, table)) {
          return { data: null, error: OVERLAP_ERROR };
        }
      }
      if (this.table === "treatment_log") {
        for (const row of newRows) {
          if (table.some((r) => r.appointment_id === row.appointment_id)) {
            return { data: null, error: DUPLICATE_ERROR };
          }
        }
      }

      table.push(...newRows);
      const projected = newRows.map((r) => project(r, this.table, this.selectStr)) as T[];
      if (this.singleMode === "single" || this.singleMode === "maybeSingle") {
        return { data: (projected[0] ?? null) as T | null, error: null };
      }
      return { data: projected, error: null };
    }

    if (this.op === "update") {
      const matches = table.filter((r) => this.filters.every((f) => matchesFilter(r, f)));
      if (this.table === "appointments" && this.payload) {
        const merged = matches.map((m) => ({ ...m, ...this.payload }));
        const others = table.filter((r) => !matches.some((m) => m.id === r.id));
        if (findOverlapConflict(merged, others)) {
          return { data: null, error: OVERLAP_ERROR };
        }
      }
      for (const row of matches) Object.assign(row, this.payload);
      const projected = matches.map((r) => project(r, this.table, this.selectStr)) as T[];
      return { data: projected, error: null };
    }

    if (this.op === "delete") {
      const matches = table.filter((r) => this.filters.every((f) => matchesFilter(r, f)));
      for (const m of matches) {
        const idx = table.indexOf(m);
        if (idx !== -1) table.splice(idx, 1);
      }
      const projected = matches.map((r) => project(r, this.table, "*")) as T[];
      return { data: projected, error: null };
    }

    if (this.op === "upsert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      const conflictCols = (this.upsertConflict ?? "id").split(",").map((s) => s.trim());
      const now = new Date().toISOString();
      const results: Row[] = [];
      for (const item of items) {
        const existing = table.find((r) => conflictCols.every((c) => r[c] === item[c]));
        if (existing) {
          Object.assign(existing, item);
          results.push(existing);
        } else {
          const newRow: Row = { id: crypto.randomUUID(), user_id: LOCAL_USER_ID, created_at: now, ...item };
          table.push(newRow);
          results.push(newRow);
        }
      }
      return { data: results as T[], error: null };
    }

    return { data: null, error: { message: "Unsupported operation" } };
  }
}

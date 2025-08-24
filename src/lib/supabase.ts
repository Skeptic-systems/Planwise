// src/lib/supabase.ts
// Supabase-like thin client that talks to our /api/db endpoint (MariaDB).
// Goals:
// - Keep API similar to supabase-js for select/insert/update/delete
// - Fix UPDATE payload to be an OBJECT (not array) so /api/db won't build `SET `0` = ?`
// - Do light DATETIME coercion: ISO strings like 'YYYY-MM-DDTHH:MM:SS(.sss)?Z' -> 'YYYY-MM-DD HH:MM:SS'
// - Minimal "join" emulation for assignments -> fields via `select(`*, fields:field_id ( name, plan_tab_id )`)`

type ApiError = { message: string };
type ApiResult<T> = Promise<{ data: T | null; error: ApiError | null }>;

function isIsoDateTimeString(v: any): v is string {
  // Matches 2025-08-24T13:05:00Z or 2025-08-24T13:05:00.000Z or without Z
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z)?$/.test(v);
}

function toMysqlDatetime(v: string): string {
  // Keep wall-clock, avoid TZ shift: slice parts out of the ISO string
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (m) return `${m[1]} ${m[2]}:${m[3]}:${m[4]}`;
  // Fallback to Date parse
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  return v;
}

function coerceDateTime<T = any>(obj: T): T {
  if (obj == null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(coerceDateTime) as any;

  const out: any = {};
  for (const [k, val] of Object.entries(obj as any)) {
    if (val && typeof val === "object") {
      out[k] = coerceDateTime(val);
    } else if (isIsoDateTimeString(val)) {
      out[k] = toMysqlDatetime(val);
    } else {
      out[k] = val;
    }
  }
  return out;
}

async function api<T>(payload: any): ApiResult<T> {
  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        if (j?.error) msg = j.error;
      } catch {}
      return { data: null, error: { message: msg } };
    }
    const json = await res.json();
    return { data: json as T, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message || "Network error" } };
  }
}

type OrderArg = { by: string; ascending?: boolean };

class Query<T = any> {
  private _op: "select" | "insert" | "update" | "delete" = "select";
  private _columns: string | "*" = "*";
  private _values: any[] | Record<string, any> | null = null;
  private _filters: any[] = [];
  private _order: OrderArg | null = null;
  private _limit: number | null = null;
  private _single = false;

  constructor(private _table: string) {}

  // ---- fluent API (mimic supabase-js) ----
  select(cols: string | string[] = "*") {
    this._op = "select";
    this._columns = Array.isArray(cols) ? cols.join(",") : cols;
    return this;
  }
  insert(values: any[] | Record<string, any>) {
    this._op = "insert";
    this._values = Array.isArray(values) ? values : [values];
    return this;
  }
  update(values: Record<string, any>) {
    this._op = "update";
    // IMPORTANT: store as OBJECT, not array
    this._values = coerceDateTime(values);
    return this;
  }
  delete() { this._op = "delete"; return this; }

  eq(column: string, value: any) { this._filters.push({ op: "eq", column, value }); return this; }
  in(column: string, values: any[]) { this._filters.push({ op: "in", column, values }); return this; }
  like(column: string, value: string) { this._filters.push({ op: "like", column, value }); return this; }
  ilike(column: string, value: string) { this._filters.push({ op: "ilike", column, value }); return this; }
  order(by: string, opts?: { ascending?: boolean }) { this._order = { by, ascending: opts?.ascending }; return this; }
  limit(n: number) { this._limit = n; return this; }
  single() { this._single = true; return this; }

  private _payloadBase() {
    const base: any = {
      op: this._op,
      table: this._table,
      columns: this._columns,
      filters: this._filters,
      order: this._order,
      limit: this._limit,
      single: this._single,
    };

    if (this._op === "insert") {
      base.values = coerceDateTime(this._values);
      base.returning = true;
    } else if (this._op === "update") {
      // send object, not array
      base.values = coerceDateTime(this._values);
      base.returning = true;
    }

    return base;
  }

  // Whether we need to emulate a join for assignments -> fields
  private _needsAssignmentJoin(): boolean {
    if (this._op !== "select" || this._table !== "assignments") return false;
    const s = (this._columns || "").toString();
    return s.includes("fields:field_id");
  }

  private async _run(): Promise<{ data: any; error: ApiError | null }> {
    if (!this._needsAssignmentJoin()) {
      return api<any>(this._payloadBase());
    }

    // 1) fetch assignments (we ask for * from backend, filtering still applies)
    const base = this._payloadBase();
    const aRes = await api<any[]>({ ...base, columns: "*" });
    if (aRes.error) return { data: null, error: aRes.error };
    const assignments = Array.isArray(aRes.data) ? aRes.data : [];

    // 2) fetch required fields (by plan or ids)
    const planIdFilter = this._filters.find((f: any) => f?.op === "eq" && f?.column === "plan_id");
    const planId = planIdFilter?.value;
    let fields: any[] = [];
    if (planId) {
      const fRes = await api<any[]>({
        op: "select",
        table: "fields",
        columns: "*",
        filters: [{ op: "eq", column: "plan_id", value: planId }],
      });
      if (!fRes.error && Array.isArray(fRes.data)) fields = fRes.data;
    } else {
      const ids = Array.from(new Set(assignments.map((a: any) => a.field_id).filter(Boolean)));
      if (ids.length) {
        const fRes = await api<any[]>({
          op: "select",
          table: "fields",
          columns: "*",
          filters: [{ op: "in", column: "id", values: ids }],
        });
        if (!fRes.error && Array.isArray(fRes.data)) fields = fRes.data;
      }
    }
    const byId = new Map(fields.map((f: any) => [f.id, f]));

    // 3) compose shape to mimic `fields:field_id (...)`
    const composed = assignments.map((a: any) => ({ ...a, fields: byId.get(a.field_id) || null }));
    return this._single ? { data: (composed[0] ?? null), error: null } : { data: composed, error: null };
  }

  then(resolve: any, reject: any) { return this._run().then(resolve, reject); }
}

export function from<T = any>(table: string) { return new Query<T>(table); }
export const supabase = { from } as const;
export const supabaseServer = supabase;

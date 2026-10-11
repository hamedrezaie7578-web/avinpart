"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ICONS, Icon } from "@/components/design-system/icon";
import { cn } from "@/lib/utils";

export type ListField = { key: string; label: string; type?: "text" | "textarea" | "icon" | "number" | "checkbox" | "url"; width?: "full" | "half"; placeholder?: string };
export type ListRow = Record<string, string | number | boolean>;

const input = "h-9 w-full rounded-lg border bg-background px-2 text-sm outline-none focus:border-primary";

export function IconSelect({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted"><Icon name={value} className="size-4" /></span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={input} dir="ltr">
        {Object.keys(ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
    </div>
  );
}

/**
 * ویرایشگر فهرست (افزودن، حذف، جابه‌جایی) برای آیتم‌های تکرارشونده مثل امکانات،
 * سؤالات متداول، نظرات، آیتم‌های منو و آمار.
 */
export function ListEditor({ fields, value, onChange, addLabel = "افزودن مورد", empty }: { fields: ListField[]; value: ListRow[]; onChange: (rows: ListRow[]) => void; addLabel?: string; empty?: ListRow }) {
  const blank: ListRow = empty ?? Object.fromEntries(fields.map((f) => [f.key, f.type === "checkbox" ? false : f.type === "icon" ? "Sparkles" : f.type === "number" ? 0 : ""]));
  const set = (i: number, k: string, v: ListRow[string]) => onChange(value.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="rounded-xl border bg-muted/20 p-3">
          <div className="mb-2 flex items-center gap-1">
            <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
            <span className="ms-auto" />
            <button type="button" onClick={() => move(i, -1)} className="rounded p-1 hover:bg-accent" aria-label="بالا"><ArrowUp className="size-4" /></button>
            <button type="button" onClick={() => move(i, 1)} className="rounded p-1 hover:bg-accent" aria-label="پایین"><ArrowDown className="size-4" /></button>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded p-1 text-destructive hover:bg-destructive/10" aria-label="حذف"><Trash2 className="size-4" /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map((f) => {
              const id = `le-${i}-${f.key}`;
              const v = row[f.key];
              return (
                <div key={f.key} className={cn(f.type === "textarea" || f.width === "full" ? "sm:col-span-2" : "")}>
                  {f.type !== "checkbox" && <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">{f.label}</label>}
                  {f.type === "textarea" ? (
                    <textarea id={id} value={String(v ?? "")} rows={3} onChange={(e) => set(i, f.key, e.target.value)} className={cn(input, "h-auto py-1.5 leading-7")} placeholder={f.placeholder} />
                  ) : f.type === "icon" ? (
                    <IconSelect id={id} value={String(v || "Sparkles")} onChange={(x) => set(i, f.key, x)} />
                  ) : f.type === "checkbox" ? (
                    <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={!!v} onChange={(e) => set(i, f.key, e.target.checked)} className="size-4" />{f.label}</label>
                  ) : (
                    <input id={id} value={String(v ?? "")} type={f.type === "number" ? "number" : "text"} dir={f.type === "url" ? "ltr" : undefined} onChange={(e) => set(i, f.key, f.type === "number" ? Number(e.target.value) : e.target.value)} className={input} placeholder={f.placeholder} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { ...blank }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary">
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}

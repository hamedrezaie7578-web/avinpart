"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Val = { included: boolean; note: string };
export type CompRow = { id?: string; group: string; title: string; tooltip: string; values: Record<string, Val> };

const input = "h-9 w-full rounded-lg border bg-background px-2 text-sm outline-none focus:border-primary";

/** ویرایش جدول مقایسه‌ی پلن‌ها: هر ردیف برای هر پلن «دارد/ندارد» و یادداشت */
export function ComparisonEditor({ plans, initial, action }: { plans: Array<{ id: string; name: string }>; initial: CompRow[]; action: (f: FormData) => Promise<{ ok: boolean; message?: string }> }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const set = (n: CompRow[]) => {
    setRows(n);
    setDirty(true);
  };
  const patch = (i: number, p: Partial<CompRow>) => set(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const n = [...rows];
    [n[i], n[j]] = [n[j]!, n[i]!];
    set(n);
  };
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th scope="col" className="p-2 text-start font-medium">گروه</th>
              <th scope="col" className="p-2 text-start font-medium">عنوان ردیف</th>
              {plans.map((p) => <th key={p.id} scope="col" className="p-2 text-start font-medium">{p.name}</th>)}
              <th scope="col" className="w-28 p-2"><span className="sr-only">عملیات</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={r.id ?? `new-${i}`} className="align-top">
                <td className="p-2"><input value={r.group} onChange={(e) => patch(i, { group: e.target.value })} className={input} aria-label="گروه" /></td>
                <td className="p-2">
                  <input value={r.title} onChange={(e) => patch(i, { title: e.target.value })} className={input} aria-label="عنوان" />
                  <input value={r.tooltip} onChange={(e) => patch(i, { tooltip: e.target.value })} className={`${input} mt-1 h-8 text-xs`} placeholder="توضیح (tooltip)" aria-label="توضیح" />
                </td>
                {plans.map((p) => {
                  const v = r.values[p.id] ?? { included: false, note: "" };
                  return (
                    <td key={p.id} className="p-2">
                      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={v.included} onChange={(e) => patch(i, { values: { ...r.values, [p.id]: { ...v, included: e.target.checked } } })} className="size-4" />دارد</label>
                      <input value={v.note} onChange={(e) => patch(i, { values: { ...r.values, [p.id]: { ...v, note: e.target.value } } })} className={`${input} mt-1 h-8 text-xs`} placeholder="یادداشت" aria-label={`یادداشت ${p.name}`} />
                    </td>
                  );
                })}
                <td className="p-2">
                  <div className="flex">
                    <button type="button" onClick={() => move(i, -1)} className="rounded p-1 hover:bg-accent" aria-label="بالا"><ArrowUp className="size-4" /></button>
                    <button type="button" onClick={() => move(i, 1)} className="rounded p-1 hover:bg-accent" aria-label="پایین"><ArrowDown className="size-4" /></button>
                    <button type="button" onClick={() => set(rows.filter((_, j) => j !== i))} className="rounded p-1 text-destructive hover:bg-destructive/10" aria-label="حذف"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => set([...rows, { group: rows.at(-1)?.group ?? "", title: "", tooltip: "", values: {} }])}><Plus className="size-4" aria-hidden />ردیف جدید</Button>
        <Button
          type="button"
          disabled={!dirty || pending}
          className="ms-auto h-10 rounded-xl px-6 font-bold"
          onClick={() =>
            start(async () => {
              const f = new FormData();
              f.set("payload", JSON.stringify(rows));
              const r = await action(f);
              if (!r.ok) return void toast.error(r.message ?? "خطا");
              toast.success(r.message ?? "ذخیره شد.");
              setDirty(false);
              router.refresh();
            })
          }
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          ذخیره‌ی جدول
        </Button>
      </div>
    </div>
  );
}

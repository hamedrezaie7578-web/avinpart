"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ListEditor, type ListField, type ListRow } from "./list-editor";
import { useMediaPicker } from "./media-picker";

type Act = (f: FormData) => Promise<{ ok: boolean; message?: string }>;

function useSave(action: Act) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const save = (payload: unknown, done?: () => void) =>
    start(async () => {
      const f = new FormData();
      f.set("payload", JSON.stringify(payload));
      const r = await action(f);
      if (!r.ok) return void toast.error(r.message ?? "خطا");
      toast.success(r.message ?? "ذخیره شد.");
      done?.();
      router.refresh();
    });
  return { pending, save };
}

function SaveBar({ pending, dirty, onSave, count }: { pending: boolean; dirty: boolean; onSave: () => void; count: number }) {
  return (
    <div className="sticky bottom-3 z-10 mt-4 flex items-center gap-3 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur">
      <span className="text-sm text-muted-foreground">{count.toLocaleString("fa-IR")} مورد{dirty ? " — تغییرات ذخیره نشده" : ""}</span>
      <Button type="button" onClick={onSave} disabled={pending || !dirty} className="ms-auto h-10 rounded-xl px-6 font-bold">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        ذخیره
      </Button>
    </div>
  );
}

/** ویرایشگر فهرست + ذخیره‌ی یکجا به‌صورت JSON (امکانات، FAQ، نظرات، آمار، …) */
export function ListSaveForm({ fields, initial, action, addLabel, empty }: { fields: ListField[]; initial: ListRow[]; action: Act; addLabel?: string; empty?: ListRow }) {
  const [rows, setRows] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const { pending, save } = useSave(action);
  return (
    <div>
      <ListEditor
        fields={fields}
        value={rows}
        onChange={(r) => {
          setRows(r);
          setDirty(true);
        }}
        addLabel={addLabel}
        empty={empty}
      />
      <SaveBar pending={pending} dirty={dirty} count={rows.length} onSave={() => save(rows, () => setDirty(false))} />
    </div>
  );
}

export type Shot = { mediaId: string; url: string; caption: string; platform: string };

const PLATFORMS = [
  { value: "", label: "—" },
  { value: "WINDOWS", label: "ویندوز" },
  { value: "ANDROID", label: "اندروید" },
  { value: "WEB", label: "وب" },
  { value: "IOS", label: "iOS" },
];

/** مدیریت گالری اسکرین‌شات‌ها: افزودن از کتابخانه، کپشن، پلتفرم و ترتیب */
export function ScreenshotsEditor({ initial, action }: { initial: Shot[]; action: Act }) {
  const [rows, setRows] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const { pick, dialog } = useMediaPicker();
  const { pending, save } = useSave(action);
  const set = (next: Shot[]) => {
    setRows(next);
    setDirty(true);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const n = [...rows];
    [n[i], n[j]] = [n[j]!, n[i]!];
    set(n);
  };
  return (
    <div>
      {dialog}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((s, i) => (
          <li key={`${s.mediaId}-${i}`} className="overflow-hidden rounded-2xl border bg-card">
            <div className="relative aspect-video bg-muted">
              <Image src={s.url} alt={s.caption || "اسکرین‌شات"} fill sizes="400px" className="object-cover" unoptimized />
            </div>
            <div className="grid gap-2 p-3">
              <input value={s.caption} onChange={(e) => set(rows.map((r, j) => (j === i ? { ...r, caption: e.target.value } : r)))} placeholder="کپشن" aria-label="کپشن" className="h-9 rounded-lg border bg-background px-2 text-sm" />
              <div className="flex items-center gap-1">
                <select value={s.platform} onChange={(e) => set(rows.map((r, j) => (j === i ? { ...r, platform: e.target.value } : r)))} aria-label="پلتفرم" className="h-9 flex-1 rounded-lg border bg-background px-2 text-sm">
                  {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button type="button" onClick={() => move(i, -1)} className="rounded p-1.5 hover:bg-accent" aria-label="قبلی"><ArrowUp className="size-4" /></button>
                <button type="button" onClick={() => move(i, 1)} className="rounded p-1.5 hover:bg-accent" aria-label="بعدی"><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => set(rows.filter((_, j) => j !== i))} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="حذف"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={async () => {
              const m = await pick();
              if (m) set([...rows, { mediaId: m.id, url: m.url, caption: m.alt, platform: "" }]);
            }}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <ImagePlus className="size-8" aria-hidden />
            افزودن تصویر
          </button>
        </li>
      </ul>
      <SaveBar pending={pending} dirty={dirty} count={rows.length} onSave={() => save(rows.map((r) => ({ mediaId: r.mediaId, caption: r.caption || null, platform: r.platform || null })), () => setDirty(false))} />
    </div>
  );
}

/** فیلد انتخاب یک تصویر (لوگو، تصویر OG، کاور) که شناسه را در input مخفی نگه می‌دارد */
export function MediaField({ name, label, initial, onChange }: { name: string; label: string; initial?: { id: string; url: string } | null; onChange?: (m: { id: string; url: string } | null) => void }) {
  const [m, setMState] = useState(initial ?? null);
  const setM = (v: { id: string; url: string } | null) => {
    setMState(v);
    onChange?.(v);
  };
  const { pick, dialog } = useMediaPicker();
  return (
    <div>
      {dialog}
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <input type="hidden" name={name} value={m?.id ?? ""} />
      <div className="flex items-center gap-3">
        <div className="relative size-20 overflow-hidden rounded-xl border bg-muted">
          {m && <Image src={m.url} alt="" fill sizes="80px" className="object-contain" unoptimized />}
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={async () => { const r = await pick(); if (r) setM({ id: r.id, url: r.url }); }}>
          <ImagePlus className="size-4" aria-hidden />
          انتخاب
        </Button>
        {m && (
          <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => setM(null)}>
            <X className="size-4" aria-hidden />
            حذف
          </Button>
        )}
      </div>
    </div>
  );
}

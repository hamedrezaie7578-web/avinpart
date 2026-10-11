"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { uploadMedia } from "@/server/actions/admin/media";

export type PickedMedia = { id: string; url: string; alt: string };

/** انتخابگر تصویر از کتابخانه‌ی رسانه (با امکان آپلود سریع) */
export function MediaPickerDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (m: PickedMedia) => void }) {
  const [items, setItems] = useState<PickedMedia[]>([]);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch(`/api/admin/media${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (r.ok) setItems(((await r.json()) as { items: Array<PickedMedia & { alt: string | null }> }).items.map((i) => ({ ...i, alt: i.alt ?? "" })));
  };
  useEffect(() => {
    if (open) void load();
  }, [open, q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl sm:max-w-4xl">
        <DialogTitle>انتخاب تصویر</DialogTitle>
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در متن جایگزین…" className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm" />
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            آپلود
            <input
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const fd = new FormData();
                Array.from(e.target.files ?? []).forEach((f) => fd.append("files", f));
                e.target.value = "";
                start(async () => {
                  const r = await uploadMedia(fd);
                  if (!r.ok) return setError(r.message);
                  setError(null);
                  await load();
                });
              }}
            />
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ul className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => { onPick(m); onClose(); }} className="block w-full overflow-hidden rounded-xl border hover:ring-2 hover:ring-primary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt} className="aspect-square w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
          {!items.length && <li className="col-span-full py-10 text-center text-sm text-muted-foreground">تصویری یافت نشد.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** هوک ساده برای استفاده‌ی Promise-محور از انتخابگر (مثلاً در ویرایشگر متن) */
export function useMediaPicker() {
  const [state, setState] = useState<{ resolve: (m: PickedMedia | null) => void } | null>(null);
  const pick = () => new Promise<PickedMedia | null>((resolve) => setState({ resolve }));
  const dialog = (
    <MediaPickerDialog
      open={!!state}
      onClose={() => {
        state?.resolve(null);
        setState(null);
      }}
      onPick={(m) => {
        state?.resolve(m);
        setState(null);
      }}
    />
  );
  return { pick, dialog };
}

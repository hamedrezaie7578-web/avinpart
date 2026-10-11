"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/dashboard/copy-button";
import { ActionForm, DeleteButton } from "./form";
import { deleteMedia, updateMediaAlt, uploadMedia } from "@/server/actions/admin/media";

type M = { id: string; url: string; alt: string | null; width: number | null; height: number | null; size: number };

export function MediaUploader() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-card p-8 text-center hover:border-primary">
      {pending ? <Loader2 className="size-8 animate-spin text-primary" /> : <Upload className="size-8 text-primary" />}
      <span className="font-bold">آپلود تصویر</span>
      <span className="text-xs text-muted-foreground">JPG، PNG، WebP، GIF — تبدیل خودکار به WebP و حذف متادیتا</span>
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
            if (r.ok) toast.success(r.message);
            else toast.error(r.message);
            router.refresh();
          });
        }}
      />
    </label>
  );
}

export function MediaGrid({ items }: { items: M[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((m) => (
        <li key={m.id} className="overflow-hidden rounded-2xl border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt={m.alt ?? ""} className="aspect-video w-full bg-muted object-cover" loading="lazy" />
          <div className="space-y-2 p-3">
            <p className="text-xs text-muted-foreground" dir="ltr">{m.width}×{m.height} · {Math.round(m.size / 1024)} KB</p>
            <ActionForm action={updateMediaAlt.bind(null, m.id)} submitLabel="ذخیره‌ی alt" className="gap-2">
              <input name="alt" defaultValue={m.alt ?? ""} placeholder="متن جایگزین (برای سئو و دسترس‌پذیری)" className="h-9 w-full rounded-lg border bg-background px-2 text-sm" />
            </ActionForm>
            <div className="flex items-center justify-between">
              <CopyButton value={m.url} label="کپی آدرس" />
              <DeleteButton action={deleteMedia.bind(null, m.id)} label="" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

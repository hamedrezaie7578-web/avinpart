"use client";

import { useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";

type F = { id: string; name: string };

/** انتخاب و آپلود پیوست برای تیکت؛ شناسه‌ی فایل‌ها را به والد گزارش می‌کند */
export function AttachmentPicker({ onChange }: { onChange: (ids: string[]) => void }) {
  const [files, setFiles] = useState<F[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (next: F[]) => {
    setFiles(next);
    onChange(next.map((f) => f.id));
  };

  return (
    <div>
      <label className="hover:bg-accent inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium">
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Paperclip className="size-4" aria-hidden />
        )}
        پیوست فایل (حداکثر ۵ فایل، هرکدام ۱۰ مگابایت)
        <input
          type="file"
          multiple
          className="sr-only"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.txt,.doc,.docx,.xls,.xlsx"
          onChange={async (e) => {
            const list = e.target.files;
            if (!list?.length) return;
            if (files.length + list.length > 5) return setError("حداکثر ۵ فایل مجاز است.");
            setBusy(true);
            setError(null);
            const fd = new FormData();
            fd.append("purpose", "ticket");
            Array.from(list).forEach((f) => fd.append("files", f));
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const json = (await res.json()) as { files?: F[]; error?: string };
            setBusy(false);
            e.target.value = "";
            if (!res.ok || !json.files) return setError(json.error ?? "آپلود ناموفق بود.");
            update([...files, ...json.files]);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="bg-muted inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
              dir="ltr"
            >
              {f.name}
              <button
                type="button"
                onClick={() => update(files.filter((x) => x.id !== f.id))}
                aria-label={`حذف ${f.name}`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

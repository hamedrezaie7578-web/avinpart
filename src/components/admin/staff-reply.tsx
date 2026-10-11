"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AttachmentPicker } from "@/components/dashboard/attachment-picker";
import { staffReply } from "@/server/actions/admin/tickets";

/** فرم پاسخ کارشناس با درج پاسخ‌های آماده و پیوست */
export function StaffReply({ ticketId, canned, customerName }: { ticketId: string; canned: Array<{ id: string; title: string; body: string }>; customerName: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [close, setClose] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await staffReply(ticketId, { body, attachmentIds: files, close });
          if (!r.ok) return void toast.error(r.message);
          toast.success(r.message ?? "ارسال شد.");
          setBody("");
          setFiles([]);
          setResetKey((k) => k + 1);
          router.refresh();
        });
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="canned" className="text-sm font-medium">پاسخ آماده:</label>
        <select
          id="canned"
          value=""
          onChange={(e) => {
            const c = canned.find((x) => x.id === e.target.value);
            if (c) setBody((b) => (b ? `${b}\n\n` : "") + c.body.replaceAll("{{name}}", customerName));
          }}
          className="h-9 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">انتخاب…</option>
          {canned.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <label htmlFor="reply" className="sr-only">متن پاسخ</label>
      <textarea id="reply" value={body} onChange={(e) => setBody(e.target.value)} rows={6} required className="w-full rounded-xl border bg-background p-3 text-sm leading-7 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="پاسخ خود را بنویسید…" />
      <AttachmentPicker key={resetKey} onChange={setFiles} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={close} onChange={(e) => setClose(e.target.checked)} className="size-4" />بستن تیکت پس از ارسال</label>
        <Button type="submit" disabled={pending || body.trim().length < 2} className="ms-auto h-10 rounded-xl px-6 font-bold">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          ارسال پاسخ
        </Button>
      </div>
    </form>
  );
}

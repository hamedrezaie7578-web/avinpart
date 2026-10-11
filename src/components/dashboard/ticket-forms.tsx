"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { closeTicket, createTicket, replyTicket } from "@/server/actions/tickets";
import { AttachmentPicker } from "./attachment-picker";

const field =
  "w-full rounded-xl border bg-background px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";

export function NewTicketForm({
  departments,
  licenses,
}: {
  departments: Array<{ id: string; name: string }>;
  licenses: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await createTicket({ ...fd, attachmentIds: ids });
          if (r.ok) router.push(`/dashboard/tickets/${r.id}`);
          else setError(r.message);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="t-dep" className="mb-1.5 block text-sm font-medium">
            دپارتمان
          </label>
          <select id="t-dep" name="departmentId" className={`${field} h-12`} required>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="t-pri" className="mb-1.5 block text-sm font-medium">
            اولویت
          </label>
          <select id="t-pri" name="priority" defaultValue="NORMAL" className={`${field} h-12`}>
            <option value="LOW">کم</option>
            <option value="NORMAL">عادی</option>
            <option value="HIGH">زیاد</option>
            <option value="URGENT">فوری (کار متوقف شده)</option>
          </select>
        </div>
      </div>
      {licenses.length > 0 && (
        <div>
          <label htmlFor="t-lic" className="mb-1.5 block text-sm font-medium">
            نرم‌افزار مرتبط <span className="text-muted-foreground">(اختیاری)</span>
          </label>
          <select id="t-lic" name="licenseId" className={`${field} h-12`} defaultValue="">
            <option value="">—</option>
            {licenses.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="t-sub" className="mb-1.5 block text-sm font-medium">
          موضوع
        </label>
        <input id="t-sub" name="subject" required maxLength={150} className={`${field} h-12`} />
      </div>
      <div>
        <label htmlFor="t-body" className="mb-1.5 block text-sm font-medium">
          شرح مشکل یا درخواست
        </label>
        <textarea id="t-body" name="body" rows={6} required className={`${field} py-3 leading-8`} />
      </div>
      <AttachmentPicker onChange={setIds} />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl font-bold sm:w-fit sm:px-10"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        ثبت تیکت
      </Button>
    </form>
  );
}

export function ReplyForm({ ticketId, closed }: { ticketId: string; closed: boolean }) {
  const [ids, setIds] = useState<string[]>([]);
  const [key, setKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      key={key}
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const body = String(new FormData(e.currentTarget).get("body") ?? "");
        start(async () => {
          const r = await replyTicket(ticketId, body, ids);
          if (r.ok) {
            setIds([]);
            setKey((k) => k + 1);
            setError(null);
          } else setError(r.message);
        });
      }}
    >
      <label htmlFor="reply" className="font-bold">
        {closed ? "ارسال پیام (تیکت دوباره باز می‌شود)" : "پاسخ شما"}
      </label>
      <textarea id="reply" name="body" rows={4} required className={`${field} py-3 leading-8`} />
      <AttachmentPicker onChange={setIds} />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} className="rounded-xl font-bold">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          ارسال پاسخ
        </Button>
        {!closed && (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={pending}
            onClick={() => start(async () => void (await closeTicket(ticketId)))}
          >
            مشکل حل شد؛ بستن تیکت
          </Button>
        )}
      </div>
    </form>
  );
}

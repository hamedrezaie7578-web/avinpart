"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitContact } from "@/server/actions/leads";

const field =
  "h-12 w-full rounded-xl border bg-background px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 aria-invalid:border-destructive";

export function ContactForm() {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (result?.ok)
    return (
      <div
        role="status"
        className="bg-card flex flex-col items-center rounded-2xl border p-10 text-center"
      >
        <CheckCircle2 className="text-success size-14" aria-hidden />
        <p className="mt-4 text-lg font-bold">پیام شما ارسال شد</p>
        <p className="text-muted-foreground mt-2 leading-7">{result.message}</p>
      </div>
    );

  return (
    <form
      noValidate
      className="bg-card grid gap-4 rounded-2xl border p-6 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await submitContact(data);
          setErrors(r.ok ? {} : (r.fieldErrors ?? {}));
          setResult(r);
        });
      }}
    >
      <h2 className="text-xl font-extrabold">ارسال پیام</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium">
            نام و نام خانوادگی
          </label>
          <input
            id="c-name"
            name="name"
            autoComplete="name"
            className={field}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-destructive mt-1 text-sm">{errors.name[0]}</p>}
        </div>
        <div>
          <label htmlFor="c-mobile" className="mb-1.5 block text-sm font-medium">
            شماره موبایل
          </label>
          <input
            id="c-mobile"
            name="mobile"
            inputMode="tel"
            autoComplete="tel"
            className={field}
            aria-invalid={!!errors.mobile}
          />
          {errors.mobile && <p className="text-destructive mt-1 text-sm">{errors.mobile[0]}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="c-subject" className="mb-1.5 block text-sm font-medium">
          موضوع
        </label>
        <select id="c-subject" name="subject" className={field} defaultValue="sales">
          <option value="sales">مشاوره‌ی خرید</option>
          <option value="support">پشتیبانی فنی</option>
          <option value="custom">سفارش نرم‌افزار یا سایت اختصاصی</option>
          <option value="other">سایر</option>
        </select>
      </div>
      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium">
          پیام
        </label>
        <textarea
          id="c-message"
          name="message"
          rows={5}
          className="bg-background focus:border-primary focus:ring-primary/15 aria-invalid:border-destructive w-full rounded-xl border p-4 leading-8 outline-none focus:ring-4"
          aria-invalid={!!errors.message}
        />
        {errors.message && <p className="text-destructive mt-1 text-sm">{errors.message[0]}</p>}
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {result && !result.ok && (
        <p role="alert" className="text-destructive text-sm">
          {result.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 rounded-xl font-bold">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        ارسال پیام
      </Button>
    </form>
  );
}

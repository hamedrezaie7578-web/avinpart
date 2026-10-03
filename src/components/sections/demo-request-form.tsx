"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitDemoRequest } from "@/server/actions/leads";
import { cn } from "@/lib/utils";

const inputCls =
  "h-12 w-full rounded-xl border bg-background px-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 aria-invalid:border-destructive";

/** فرم درخواست دمو / مشاوره‌ی رایگان (اعتبارسنجی نهایی در سرور با Zod) */
export function DemoRequestForm({
  productSlug,
  productName,
  compact,
}: {
  productSlug?: string;
  productName?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (result?.ok) {
    return (
      <div
        role="status"
        className="bg-card text-card-foreground flex flex-col items-center rounded-2xl border p-8 text-center"
      >
        <CheckCircle2 className="text-success size-14" aria-hidden />
        <p className="mt-4 text-lg font-bold">درخواست شما ثبت شد</p>
        <p className="text-muted-foreground mt-2 leading-7">{result.message}</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className={cn(
        "bg-card text-card-foreground rounded-2xl border p-5 shadow-xl md:p-7",
        compact && "shadow-none",
      )}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await submitDemoRequest({ ...fd, productSlug, source: pathname });
          setErrors(r.ok ? {} : (r.fieldErrors ?? {}));
          setResult(r);
        });
      }}
    >
      <p className="text-lg font-extrabold">
        {productName ? `دموی رایگان ${productName}` : "دموی رایگان و مشاوره"}
      </p>
      <p className="text-muted-foreground mt-1 mb-5 text-sm">
        شماره‌تان را بگذارید؛ کارشناس ما تماس می‌گیرد و نرم‌افزار را زنده نشانتان می‌دهد.
      </p>
      <div className="grid gap-4">
        <div>
          <label htmlFor="demo-name" className="mb-1.5 block text-sm font-medium">
            نام و نام خانوادگی
          </label>
          <input
            id="demo-name"
            name="name"
            required
            autoComplete="name"
            className={inputCls}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "demo-name-err" : undefined}
          />
          {errors.name && (
            <p id="demo-name-err" className="text-destructive mt-1 text-sm">
              {errors.name[0]}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="demo-mobile" className="mb-1.5 block text-sm font-medium">
            شماره موبایل
          </label>
          <input
            id="demo-mobile"
            name="mobile"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            className={inputCls}
            aria-invalid={!!errors.mobile}
            aria-describedby={errors.mobile ? "demo-mobile-err" : undefined}
          />
          {errors.mobile && (
            <p id="demo-mobile-err" className="text-destructive mt-1 text-sm">
              {errors.mobile[0]}
            </p>
          )}
        </div>
        {!compact && (
          <div>
            <label htmlFor="demo-business" className="mb-1.5 block text-sm font-medium">
              نام کسب‌وکار <span className="text-muted-foreground">(اختیاری)</span>
            </label>
            <input id="demo-business" name="businessName" className={inputCls} />
          </div>
        )}
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">نوع درخواست</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["DEMO", "دموی آنلاین"],
              ["CONSULT", "مشاوره‌ی خرید"],
            ].map(([v, l], i) => (
              <label
                key={v}
                className="has-[:checked]:border-brand has-[:checked]:bg-brand-surface has-[:checked]:text-brand flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium"
              >
                <input
                  type="radio"
                  name="type"
                  value={v}
                  defaultChecked={i === 0}
                  className="accent-[var(--brand)]"
                />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-brand-fg hover:bg-brand/90 h-12 rounded-xl text-base font-bold"
        >
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
          {pending ? "در حال ثبت…" : "ثبت درخواست رایگان"}
        </Button>
        {result && !result.ok && (
          <p role="alert" className="text-destructive text-sm">
            {result.message}
          </p>
        )}
        <p className="text-muted-foreground text-center text-xs">بدون هزینه و بدون تعهد خرید</p>
      </div>
    </form>
  );
}

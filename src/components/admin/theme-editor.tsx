"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { auditTheme, themeToCssVars, type ProductTheme } from "@/lib/theme";
import { ActionForm } from "./form";

const FIELDS: Array<[keyof ProductTheme, string]> = [
  ["primary", "رنگ اصلی (دکمه‌ها و تأکیدها)"],
  ["primaryFg", "متن روی رنگ اصلی"],
  ["secondary", "رنگ مکمل"],
  ["secondaryFg", "متن روی رنگ مکمل"],
  ["surface", "پس‌زمینه‌ی ملایم سکشن‌ها"],
  ["gradientFrom", "شروع گرادیان هیرو"],
  ["gradientTo", "پایان گرادیان هیرو"],
  ["heroFg", "متن روی هیرو"],
];

/** ویرایش پالت صنف با Color picker، پیش‌نمایش زنده و بررسی کنتراست WCAG AA */
export function ThemeEditor({ initial, action, name }: { initial: ProductTheme; action: (f: FormData) => Promise<{ ok: boolean; message?: string }>; name: string }) {
  const [t, setT] = useState<ProductTheme>(initial);
  const issues = useMemo(() => auditTheme(t), [t]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ActionForm action={action}>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 rounded-xl border p-2 text-sm">
              <input type="color" name={k} value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} className="size-10 cursor-pointer rounded-lg border-0 bg-transparent" />
              <span className="min-w-0">
                <span className="block">{label}</span>
                <input value={t[k]} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setT({ ...t, [k]: e.target.value })} dir="ltr" className="mt-0.5 w-24 rounded border bg-background px-1 font-mono text-xs" aria-label={`${label} (hex)`} />
              </span>
            </label>
          ))}
        </div>
        {issues.length ? (
          <div role="alert" className="rounded-xl bg-warning/10 p-3 text-sm text-warning">
            <p className="flex items-center gap-2 font-bold"><AlertTriangle className="size-4" aria-hidden />کنتراست ناکافی (WCAG AA)</p>
            <ul className="mt-1 list-inside list-disc">
              {issues.map((i) => <li key={i.pair} dir="ltr" className="text-start">{i.pair}: {i.ratio.toFixed(2)} (≥ {i.required})</li>)}
            </ul>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success"><CheckCircle2 className="size-4" aria-hidden />همه‌ی ترکیب‌ها کنتراست استاندارد دارند.</p>
        )}
      </ActionForm>
      <div data-product-theme style={themeToCssVars(t) as React.CSSProperties} className="overflow-hidden rounded-2xl border" aria-label="پیش‌نمایش">
        <div className="bg-brand-gradient p-6 text-brand-hero-fg">
          <p className="text-xs opacity-80">پیش‌نمایش هیرو</p>
          <p className="mt-2 text-2xl font-black">{name}</p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-slate-900">خرید</span>
            <span className="glass-on-dark rounded-lg px-3 py-1.5 text-sm font-bold">دموی رایگان</span>
          </div>
        </div>
        <div className="space-y-3 bg-brand-surface p-6">
          <p className="text-sm font-bold text-brand">عنوان کوچک سکشن</p>
          <div className="flex gap-2">
            <span className="rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-brand-fg">دکمه‌ی اصلی</span>
            <span className="rounded-lg bg-brand-2 px-3 py-1.5 text-sm font-bold text-brand-2-fg">نشان مکمل</span>
          </div>
        </div>
      </div>
    </div>
  );
}

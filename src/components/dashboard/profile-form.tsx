"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/server/actions/profile";

type U = {
  name: string | null;
  email: string | null;
  businessName: string | null;
  businessType: string | null;
  nationalId: string | null;
  economicCode: string | null;
  city: string | null;
  address: string | null;
};

const field =
  "h-12 w-full rounded-xl border bg-background px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";

export function ProfileForm({ user }: { user: U }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  // تابع کمکی (نه کامپوننت) تا با رندر مجدد، inputها remount نشوند
  const f = (name: keyof U, label: string, dir?: "ltr", hint?: string) => (
    <div key={name}>
      <label htmlFor={`p-${name}`} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={`p-${name}`}
        name={name}
        defaultValue={user[name] ?? ""}
        dir={dir}
        className={field}
      />
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await updateProfile(data);
          setMsg({ ok: r.ok, text: r.message });
        });
      }}
    >
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-extrabold">اطلاعات شخصی</legend>
        {f("name", "نام و نام خانوادگی", undefined)}
        {f("email", "ایمیل", "ltr")}
      </fieldset>
      <fieldset className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        <legend className="mb-3 pt-5 font-extrabold">اطلاعات کسب‌وکار (برای فاکتور رسمی)</legend>
        {f("businessName", "نام کسب‌وکار / شرکت")}
        {f("businessType", "نوع فعالیت", undefined)}
        {f(
          "nationalId",
          "کد ملی / شناسه‌ی ملی",
          "ltr",
          "۱۰ رقم برای اشخاص حقیقی، ۱۱ رقم برای حقوقی",
        )}
        {f("economicCode", "کد اقتصادی", "ltr")}
        {f("city", "شهر", undefined)}
        <div className="sm:col-span-2">{f("address", "نشانی", undefined)}</div>
      </fieldset>
      {msg && (
        <p
          role={msg.ok ? "status" : "alert"}
          className={msg.ok ? "text-success text-sm" : "text-destructive text-sm"}
        >
          {msg.text}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl font-bold sm:w-fit sm:px-10"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        ذخیره‌ی تغییرات
      </Button>
    </form>
  );
}

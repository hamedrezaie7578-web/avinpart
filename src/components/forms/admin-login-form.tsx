"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminSignIn } from "@/server/actions/auth";

const field =
  "h-12 w-full rounded-xl border bg-background px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";

export function AdminLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [needTotp, setNeedTotp] = useState(false);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await adminSignIn(
            String(fd.get("identifier")),
            String(fd.get("password")),
            callbackUrl,
            needTotp ? String(fd.get("totp") ?? "") : undefined,
          );
          if (r && !r.ok) {
            setError(r.message);
            if (r.needTotp) setNeedTotp(true);
          }
        });
      }}
    >
      <div>
        <label htmlFor="adm-id" className="mb-1.5 block text-sm font-medium">
          موبایل یا ایمیل
        </label>
        <input
          id="adm-id"
          name="identifier"
          dir="ltr"
          autoComplete="username"
          required
          className={field}
        />
      </div>
      <div>
        <label htmlFor="adm-pass" className="mb-1.5 block text-sm font-medium">
          رمز عبور
        </label>
        <input
          id="adm-pass"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          className={field}
        />
      </div>
      {needTotp && (
        <div>
          <label htmlFor="adm-totp" className="mb-1.5 block text-sm font-medium">
            کد ورود دومرحله‌ای
          </label>
          <input
            id="adm-totp"
            name="totp"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            required
            className={`${field} text-center font-mono text-xl tracking-[0.5em]`}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl font-bold">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        ورود به پنل مدیریت
      </Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startTwoFactor } from "@/server/actions/admin/account";

/** نمایش QR برای اسکن در Google/Microsoft Authenticator */
export function TwoFactorSetup() {
  const [data, setData] = useState<{ secret: string; qr: string } | null>(null);
  const [pending, start] = useTransition();
  if (!data)
    return (
      <Button type="button" variant="outline" className="rounded-xl" disabled={pending} onClick={() => start(async () => {
        const r = await startTwoFactor();
        if (!r.ok) return void toast.error(r.message);
        setData(r.data!);
      })}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        ساخت کلید و نمایش QR
      </Button>
    );
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.qr} alt="کد QR ورود دومرحله‌ای" width={180} height={180} className="rounded-xl border bg-white p-1" />
      <div className="text-sm">
        <p>۱. QR را با برنامه‌ی Authenticator اسکن کنید.</p>
        <p className="mt-1">یا کلید را دستی وارد کنید:</p>
        <code dir="ltr" className="mt-1 block rounded bg-muted px-2 py-1 font-mono text-xs break-all">{data.secret}</code>
        <p className="mt-2">۲. کد ۶ رقمی را پایین وارد و تأیید کنید.</p>
      </div>
    </div>
  );
}

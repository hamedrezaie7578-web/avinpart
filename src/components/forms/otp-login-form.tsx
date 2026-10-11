"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Pencil, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestOtp, verifyOtpAndSignIn } from "@/server/actions/auth";
import { toEnDigits, toFaDigits } from "@/lib/format";

const field =
  "h-13 w-full rounded-xl border bg-background px-4 text-lg outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 aria-invalid:border-destructive";

/** ورود دومرحله‌ای: شماره موبایل ← کد یکبارمصرف */
export function OtpLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [step, setStep] = useState<"mobile" | "code">("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [countdown, setCountdown] = useState(0);
  const [pending, start] = useTransition();
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  const send = () =>
    start(async () => {
      setError(null);
      const r = await requestOtp(mobile);
      if (!r.ok) {
        setError(r.message);
        if (r.retryAfter) {
          setCountdown(r.retryAfter);
          if (step === "mobile") setStep("code");
        }
        return;
      }
      setMobile(r.mobile);
      setDevCode(r.devCode);
      setCountdown(r.resendIn);
      setCode("");
      setStep("code");
    });

  const verify = (value = code) =>
    start(async () => {
      setError(null);
      const r = await verifyOtpAndSignIn(mobile, toEnDigits(value), callbackUrl);
      if (r && !r.ok) {
        setError(r.message);
        setCode("");
      }
    });

  return (
    <div>
      {step === "mobile" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          noValidate
        >
          <label htmlFor="login-mobile" className="mb-2 block font-medium">
            شماره موبایل
          </label>
          <div className="relative">
            <Smartphone
              className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2"
              aria-hidden
            />
            <input
              id="login-mobile"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="0912 345 6789"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className={`${field} ps-12 text-start`}
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={pending || !mobile}
            className="mt-5 h-12 w-full rounded-xl text-base font-bold"
          >
            {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
            دریافت کد ورود
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
          noValidate
        >
          <div className="bg-muted/60 mb-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm">
            <span>
              کد به <strong dir="ltr">{toFaDigits(mobile)}</strong> پیامک شد
            </span>
            <button
              type="button"
              onClick={() => setStep("mobile")}
              className="text-primary inline-flex items-center gap-1 font-bold hover:underline"
            >
              <Pencil className="size-3.5" aria-hidden /> ویرایش
            </button>
          </div>
          <label htmlFor="login-code" className="mb-2 block font-medium">
            کد تأیید
          </label>
          <input
            ref={codeRef}
            id="login-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const v = toEnDigits(e.target.value).replace(/\D/g, "");
              setCode(v);
              if (v.length === 5) verify(v);
            }}
            className={`${field} text-center text-2xl tracking-[0.6em]`}
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
          />
          {devCode && (
            <p className="bg-warning/10 text-warning mt-2 rounded-lg p-2 text-center text-sm">
              محیط توسعه — کد: <strong dir="ltr">{devCode}</strong>
            </p>
          )}
          <Button
            type="submit"
            disabled={pending || code.length < 4}
            className="mt-5 h-12 w-full rounded-xl text-base font-bold"
          >
            {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
            ورود
          </Button>
          <div className="mt-4 text-center text-sm">
            {countdown > 0 ? (
              <span className="text-muted-foreground">
                ارسال دوباره تا {toFaDigits(countdown)} ثانیه‌ی دیگر
              </span>
            ) : (
              <button
                type="button"
                onClick={send}
                disabled={pending}
                className="text-primary font-bold hover:underline"
              >
                ارسال دوباره‌ی کد
              </button>
            )}
          </div>
        </form>
      )}
      {error && (
        <p
          id="login-error"
          role="alert"
          className="bg-destructive/10 text-destructive mt-4 rounded-xl p-3 text-center text-sm"
        >
          {error}
        </p>
      )}
    </div>
  );
}

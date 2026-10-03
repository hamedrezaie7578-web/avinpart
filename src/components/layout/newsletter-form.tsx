"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/server/actions/leads";

export function NewsletterForm() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        start(async () => {
          const r = await subscribeNewsletter({
            mobile: fd.get("mobile"),
            website: fd.get("website"),
          });
          setMsg({ ok: r.ok, text: r.message });
          if (r.ok) form.reset();
        });
      }}
    >
      <label htmlFor="nl-mobile" className="sr-only">
        شماره موبایل
      </label>
      <div className="flex gap-2">
        <input
          id="nl-mobile"
          name="mobile"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="شماره موبایل"
          className="bg-background focus:border-primary h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none"
        />
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <Button type="submit" disabled={pending} className="h-11 rounded-xl px-4 font-bold">
          {pending ? "…" : "عضویت"}
        </Button>
      </div>
      {msg && (
        <p
          role="status"
          className={msg.ok ? "text-success mt-2 text-sm" : "text-destructive mt-2 text-sm"}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}

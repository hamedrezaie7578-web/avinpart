"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyCoupon,
  changeCartPlan,
  checkout,
  removeCoupon,
  removeFromCart,
} from "@/server/actions/cart";

export function RemoveItemButton({ itemId, label }: { itemId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(async () => void (await removeFromCart(itemId)))}
      disabled={pending}
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg p-2 transition"
      aria-label={`حذف ${label} از سبد`}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}

export function PlanSelect({
  itemId,
  current,
  plans,
}: {
  itemId: string;
  current: string;
  plans: Array<{ code: string; name: string }>;
}) {
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">پلن:</span>
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => start(async () => void (await changeCartPlan(itemId, e.target.value)))}
        className="bg-background h-9 rounded-lg border px-2 font-medium"
      >
        {plans.map((p) => (
          <option key={p.code} value={p.code}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CouponForm({ applied }: { applied: string | null }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (applied)
    return (
      <div className="bg-success/10 text-success flex items-center justify-between rounded-xl px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-2">
          <Tag className="size-4" aria-hidden />
          کد <strong dir="ltr">{applied}</strong> اعمال شد
        </span>
        <button
          type="button"
          onClick={() => start(async () => void (await removeCoupon()))}
          aria-label="حذف کد تخفیف"
          className="hover:bg-success/10 rounded p-1"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const code = String(new FormData(e.currentTarget).get("code") ?? "");
        start(async () => {
          const r = await applyCoupon(code);
          setMsg({ ok: r.ok, text: r.message ?? "" });
        });
      }}
    >
      <label htmlFor="coupon" className="sr-only">
        کد تخفیف
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          name="code"
          dir="ltr"
          placeholder="کد تخفیف"
          className="bg-background focus:border-primary h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm uppercase outline-none"
        />
        <Button type="submit" variant="outline" disabled={pending} className="h-11 rounded-xl">
          {pending ? <Loader2 className="size-4 animate-spin" /> : "اعمال"}
        </Button>
      </div>
      {msg && !msg.ok && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {msg.text}
        </p>
      )}
    </form>
  );
}

export function CheckoutButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <Button
        type="button"
        disabled={disabled || pending}
        className="h-13 w-full rounded-xl text-base font-bold"
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await checkout();
            if (r.ok) {
              window.location.assign(r.redirectUrl);
              return;
            }
            if (r.needLogin) router.push(`/login?callbackUrl=${encodeURIComponent("/cart")}`);
            else setError(r.message);
          })
        }
      >
        {pending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Lock className="size-5" aria-hidden />
        )}
        پرداخت امن و ثبت سفارش
      </Button>
      {error && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          {error}
        </p>
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { payOrder } from "@/server/actions/cart";

export function PayAgainButton({
  orderId,
  label = "پرداخت دوباره",
}: {
  orderId: string;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <Button
        className="h-12 rounded-xl font-bold"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await payOrder(orderId);
            if (r.ok) window.location.assign(r.redirectUrl);
            else setError(r.message);
          })
        }
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {label}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { ActionButton } from "./form";
import { cancelOrder, markOrderPaid, refundOrder } from "@/server/actions/admin/orders";

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [ref, setRef] = useState("");
  const [revoke, setRevoke] = useState(true);
  if (status === "PENDING")
    return (
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">شماره‌ی پیگیری واریز (اختیاری)</span>
          <input value={ref} onChange={(e) => setRef(e.target.value)} dir="ltr" className="h-9 rounded-lg border bg-background px-2" />
        </label>
        <ActionButton action={() => markOrderPaid(orderId, ref)} confirm="پرداخت این سفارش به‌صورت دستی تأیید و لایسنس صادر شود؟" variant="default">ثبت پرداخت دستی</ActionButton>
        <ActionButton action={() => cancelOrder(orderId)} confirm="سفارش لغو شود؟">لغو سفارش</ActionButton>
      </div>
    );
  if (status === "PAID")
    return (
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={revoke} onChange={(e) => setRevoke(e.target.checked)} className="size-4" />ابطال لایسنس‌های این سفارش</label>
        <ActionButton action={() => refundOrder(orderId, revoke)} confirm="بازگشت وجه ثبت شود؟ (مبلغ باید جداگانه از طریق بانک واریز شود)" className="text-destructive">ثبت بازگشت وجه</ActionButton>
      </div>
    );
  return null;
}

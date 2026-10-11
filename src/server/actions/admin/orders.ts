"use server";

import { db } from "@/lib/db";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fulfillOrder } from "@/server/orders";

/** ثبت پرداخت دستی (کارت‌به‌کارت/حضوری) و تکمیل سفارش */
export async function markOrderPaid(orderId: string, refId: string) {
  return adminAction("orders.write", async (admin) => {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "PENDING") throw new ActionError("فقط سفارش در انتظار پرداخت قابل ثبت است.");
    const payment = await db.payment.create({ data: { orderId, gateway: "manual", amount: order.total, authority: `MANUAL-${orderId}-${Date.now()}` } });
    await fulfillOrder(orderId, payment.id, { refId: refId || "MANUAL" });
    await audit(admin.id, "order.mark_paid", "Order", orderId, { refId });
    return { ok: true, message: "سفارش پرداخت‌شده ثبت و لایسنس صادر شد." };
  });
}

export async function cancelOrder(orderId: string) {
  return adminAction("orders.write", async (admin) => {
    const r = await db.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "CANCELED" } });
    if (!r.count) throw new ActionError("فقط سفارش در انتظار پرداخت قابل لغو است.");
    await audit(admin.id, "order.cancel", "Order", orderId);
    return { ok: true, message: "سفارش لغو شد." };
  });
}

/** بازگشت وجه: وضعیت سفارش و پرداخت + ابطال لایسنس‌های صادرشده از این سفارش */
export async function refundOrder(orderId: string, revokeLicenses: boolean) {
  return adminAction("orders.refund", async (admin) => {
    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: { include: { license: true } } } });
    if (!order || order.status !== "PAID") throw new ActionError("فقط سفارش پرداخت‌شده قابل بازگشت وجه است.");
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
      await tx.payment.updateMany({ where: { orderId, status: "SUCCESS" }, data: { status: "REFUNDED" } });
      if (revokeLicenses) {
        for (const it of order.items) {
          if (it.license) {
            await tx.license.update({ where: { id: it.license.id }, data: { status: "REVOKED", logs: { create: { action: "revoke", result: "refund" } } } });
          }
        }
      }
    });
    await audit(admin.id, "order.refund", "Order", orderId, { revokeLicenses });
    return { ok: true, message: "بازگشت وجه ثبت شد." };
  });
}

export async function updateOrderNote(orderId: string, f: FormData) {
  return adminAction("orders.write", async (admin) => {
    const note = String(f.get("note") ?? "").trim().slice(0, 2000);
    await db.order.update({ where: { id: orderId }, data: { note: note || null } });
    await audit(admin.id, "order.note", "Order", orderId);
  });
}

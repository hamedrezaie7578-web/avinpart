import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { generateLicenseKey } from "@/lib/license";
import { getPaymentGateway, tomanToRial } from "@/lib/payment";
import { sendTemplateSms } from "@/lib/sms";
import { SITE_URL } from "@/lib/site";
import { formatNumber } from "@/lib/format";

/** شروع پرداخت یک سفارش: ثبت Payment و دریافت آدرس درگاه */
export async function startPayment(
  orderId: string,
  userMobile: string,
): Promise<{ ok: true; redirectUrl: string } | { ok: false; message: string }> {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== "PENDING") return { ok: false, message: "این سفارش قابل پرداخت نیست." };

  // سفارش رایگان (مثلاً با کوپن ۱۰۰٪) بدون درگاه تکمیل می‌شود
  if (order.total === 0) {
    const payment = await db.payment.create({
      data: {
        orderId,
        gateway: "free",
        amount: 0,
        status: "INITIATED",
        authority: `FREE-${orderId}`,
      },
    });
    await fulfillOrder(orderId, payment.id, { refId: "FREE" });
    return { ok: true, redirectUrl: `/payment/result?order=${orderId}` };
  }

  const gateway = getPaymentGateway();
  const callbackUrl = `${SITE_URL}/api/payment/callback?gw=${gateway.name}`;
  const r = await gateway.request({
    amountRial: tomanToRial(order.total),
    description: `سفارش ${order.number} — AvinApps`,
    callbackUrl,
    mobile: userMobile,
    orderId,
  });
  if (!r.ok) return r;
  await db.payment.create({
    data: { orderId, gateway: gateway.name, amount: order.total, authority: r.authority },
  });
  return { ok: true, redirectUrl: r.redirectUrl };
}

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 86400_000);
}

/**
 * تکمیل سفارش پس از تأیید پرداخت (idempotent): وضعیت سفارش، صدور/ارتقا/تمدید لایسنس،
 * شمارش کوپن، خالی کردن سبد و ارسال پیامک.
 */
export async function fulfillOrder(
  orderId: string,
  paymentId: string,
  info: { refId: string; cardPan?: string; raw?: unknown },
) {
  const done = await db.$transaction(async (tx) => {
    // قفل خوش‌بینانه: فقط سفارش PENDING به PAID تبدیل می‌شود (جلوگیری از صدور دوباره‌ی لایسنس)
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (updated.count === 0) return false;

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        refId: info.refId,
        cardPan: info.cardPan,
        verifiedAt: new Date(),
        raw: (info.raw ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: { include: { plan: true } } },
    });
    if (order.couponId)
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { increment: 1 } },
      });

    for (const item of order.items) {
      const plan = item.plan;
      if (order.kind === "PURCHASE") {
        let key = generateLicenseKey();
        while (await tx.license.findUnique({ where: { key } })) key = generateLicenseKey();
        await tx.license.create({
          data: {
            key,
            userId: order.userId,
            productId: item.productId,
            planId: plan.id,
            orderItemId: item.id,
            maxDevices: plan.maxDevices,
            expiresAt: plan.durationDays ? addDays(new Date(), plan.durationDays) : null,
            logs: { create: { action: "issue", result: "ok" } },
          },
        });
      } else if (order.upgradeFromLicenseId) {
        const lic = await tx.license.findUniqueOrThrow({
          where: { id: order.upgradeFromLicenseId },
        });
        if (order.kind === "UPGRADE") {
          await tx.license.update({
            where: { id: lic.id },
            data: {
              planId: plan.id,
              maxDevices: Math.max(plan.maxDevices, lic.maxDevices),
              expiresAt: plan.durationDays ? addDays(new Date(), plan.durationDays) : null,
              status: "ACTIVE",
              logs: { create: { action: "upgrade", result: `ok:${plan.code}` } },
            },
          });
        } else {
          const from = lic.expiresAt && lic.expiresAt > new Date() ? lic.expiresAt : new Date();
          await tx.license.update({
            where: { id: lic.id },
            data: {
              expiresAt: addDays(from, plan.durationDays ?? 365),
              status: "ACTIVE",
              logs: { create: { action: "renew", result: "ok" } },
            },
          });
        }
      }
    }
    if (order.kind === "PURCHASE") {
      await tx.cartItem.deleteMany({ where: { cart: { userId: order.userId } } });
      await tx.cart.updateMany({ where: { userId: order.userId }, data: { couponCode: null } });
    }
    await tx.adminNotification.create({
      data: {
        type: "order",
        title: `سفارش ${order.number} پرداخت شد (${formatNumber(order.total)} تومان)`,
        href: `/admin/orders/${order.id}`,
      },
    });
    return true;
  });

  if (done) {
    const order = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { user: true },
    });
    await sendTemplateSms("order_paid", order.user.mobile, {
      name: order.user.name ?? "مشتری",
      number: order.number,
    });
  }
  return done;
}

export async function failPayment(paymentId: string, raw?: unknown) {
  const p = await db.payment.update({
    where: { id: paymentId },
    data: { status: "FAILED", raw: (raw ?? undefined) as Prisma.InputJsonValue | undefined },
  });
  // سفارش PENDING می‌ماند تا کاربر بتواند دوباره پرداخت کند
  return p;
}

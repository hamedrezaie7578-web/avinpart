"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { getCartId, getCartView, validateCoupon } from "@/server/cart";
import { startPayment } from "@/server/orders";

type Result = { ok: true; message?: string } | { ok: false; message: string };

/** افزودن محصول + پلن به سبد (هر ترکیب فقط یک بار) */
export async function addToCart(productSlug: string, planCode: string): Promise<Result> {
  const [product, plan] = await Promise.all([
    db.product.findFirst({ where: { slug: productSlug, status: "PUBLISHED" } }),
    db.plan.findFirst({ where: { code: planCode, isActive: true } }),
  ]);
  if (!product || !plan) return { ok: false, message: "محصول یا پلن انتخاب‌شده معتبر نیست." };
  const override = await db.productPlanPrice.findUnique({
    where: { productId_planId: { productId: product.id, planId: plan.id } },
  });
  if (override && !override.isAvailable)
    return { ok: false, message: "این پلن برای این محصول ارائه نمی‌شود." };

  const cartId = (await getCartId({ create: true }))!;
  await db.cartItem.upsert({
    where: { cartId_productId_planId: { cartId, productId: product.id, planId: plan.id } },
    update: {},
    create: { cartId, productId: product.id, planId: plan.id },
  });
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeFromCart(itemId: string): Promise<Result> {
  const cartId = await getCartId({ create: false });
  if (!cartId) return { ok: false, message: "سبد خرید یافت نشد." };
  await db.cartItem.deleteMany({ where: { id: itemId, cartId } });
  revalidatePath("/cart");
  return { ok: true };
}

/** تغییر پلن یک قلم سبد */
export async function changeCartPlan(itemId: string, planCode: string): Promise<Result> {
  const cartId = await getCartId({ create: false });
  const plan = await db.plan.findFirst({ where: { code: planCode, isActive: true } });
  const item = cartId ? await db.cartItem.findFirst({ where: { id: itemId, cartId } }) : null;
  if (!item || !plan) return { ok: false, message: "درخواست نامعتبر است." };
  const dup = await db.cartItem.findFirst({
    where: { cartId: item.cartId, productId: item.productId, planId: plan.id },
  });
  if (dup) await db.cartItem.delete({ where: { id: item.id } });
  else await db.cartItem.update({ where: { id: item.id }, data: { planId: plan.id } });
  revalidatePath("/cart");
  return { ok: true };
}

export async function applyCoupon(code: string): Promise<Result> {
  const ip = await getClientIp();
  if (!(await rateLimit(`coupon:${ip}`, 10, 600)).ok)
    return { ok: false, message: "تلاش‌های زیادی انجام شد؛ کمی بعد دوباره امتحان کنید." };
  const cartId = await getCartId({ create: false });
  if (!cartId) return { ok: false, message: "سبد خرید شما خالی است." };
  const view = await getCartView();
  const session = await auth();
  const valid = view.lines.filter((l) => l.available);
  const r = await validateCoupon(code, {
    userId: session?.user?.id ?? null,
    subtotal: view.subtotal,
    lines: valid,
  });
  if (!r.ok) return { ok: false, message: r.error };
  await db.cart.update({ where: { id: cartId }, data: { couponCode: r.coupon.code } });
  revalidatePath("/cart");
  return { ok: true, message: "کد تخفیف اعمال شد." };
}

export async function removeCoupon(): Promise<Result> {
  const cartId = await getCartId({ create: false });
  if (cartId) await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
  revalidatePath("/cart");
  return { ok: true };
}

/** ثبت سفارش از روی سبد و انتقال به درگاه */
export async function checkout(): Promise<
  { ok: true; redirectUrl: string } | { ok: false; message: string; needLogin?: boolean }
> {
  const session = await auth();
  if (!session?.user)
    return { ok: false, message: "برای ادامه‌ی خرید وارد حساب کاربری شوید.", needLogin: true };

  const view = await getCartView();
  const lines = view.lines.filter((l) => l.available);
  if (!lines.length) return { ok: false, message: "سبد خرید شما خالی است." };
  if (view.couponError) return { ok: false, message: view.couponError };

  const coupon = view.coupon
    ? await db.coupon.findUnique({ where: { code: view.coupon.code } })
    : null;
  const order = await db.order.create({
    data: {
      userId: session.user.id,
      kind: "PURCHASE",
      subtotal: view.subtotal,
      discount: view.discount,
      tax: view.tax,
      total: view.total,
      couponId: coupon?.id,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          planId: l.planId,
          unitPrice: l.price,
          title: `${l.productName} — ${l.planName}`,
        })),
      },
    },
  });
  return startPayment(order.id, session.user.mobile);
}

/** پرداخت مجدد سفارش در انتظار پرداخت (از پنل کاربری) */
export async function payOrder(orderId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, message: "ابتدا وارد شوید." };
  const order = await db.order.findFirst({
    where: { id: orderId, userId: session.user.id, status: "PENDING" },
  });
  if (!order) return { ok: false as const, message: "سفارش قابل پرداخت یافت نشد." };
  return startPayment(order.id, session.user.mobile);
}

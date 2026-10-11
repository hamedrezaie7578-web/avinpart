import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { Coupon } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { couponDiscount, resolvePrice, addTax } from "@/lib/pricing";
import { getSettings } from "@/server/queries/settings";

const GUEST_COOKIE = "avin_cart";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** شناسه‌ی سبد کاربر یا مهمان؛ در صورت نیاز سبد و کوکی مهمان ساخته می‌شود */
export async function getCartId(opts: { create: boolean }): Promise<string | null> {
  const userId = await currentUserId();
  if (userId) {
    const cart = opts.create
      ? await db.cart.upsert({ where: { userId }, update: {}, create: { userId } })
      : await db.cart.findUnique({ where: { userId } });
    return cart?.id ?? null;
  }
  const jar = await cookies();
  let guestId = jar.get(GUEST_COOKIE)?.value;
  if (!guestId) {
    if (!opts.create) return null;
    guestId = randomUUID();
    jar.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 3600,
      path: "/",
    });
  }
  const cart = opts.create
    ? await db.cart.upsert({ where: { guestId }, update: {}, create: { guestId } })
    : await db.cart.findUnique({ where: { guestId } });
  return cart?.id ?? null;
}

/** انتقال سبد مهمان به حساب کاربر پس از ورود */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (!guestId) return;
  const guest = await db.cart.findUnique({ where: { guestId }, include: { items: true } });
  if (guest) {
    const userCart = await db.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    for (const it of guest.items) {
      await db.cartItem.upsert({
        where: {
          cartId_productId_planId: {
            cartId: userCart.id,
            productId: it.productId,
            planId: it.planId,
          },
        },
        update: {},
        create: { cartId: userCart.id, productId: it.productId, planId: it.planId },
      });
    }
    if (guest.couponCode && !userCart.couponCode)
      await db.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
    await db.cart.delete({ where: { id: guest.id } });
  }
  jar.delete(GUEST_COOKIE);
}

export type CartLine = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  industryName: string;
  icon: string;
  theme: unknown;
  planId: string;
  planCode: string;
  planName: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
};

export type CartView = {
  id: string | null;
  lines: CartLine[];
  subtotal: number;
  coupon: { code: string; discount: number } | null;
  couponError: string | null;
  discount: number;
  taxPercent: number;
  tax: number;
  total: number;
};

/** محاسبه‌ی قیمت هر قلم با قیمت اختصاصی محصول و تخفیف زمان‌دار جاری */
export async function priceLine(productId: string, planId: string) {
  const [plan, override, discounts] = await Promise.all([
    db.plan.findUniqueOrThrow({ where: { id: planId } }),
    db.productPlanPrice.findUnique({ where: { productId_planId: { productId, planId } } }),
    db.timedDiscount.findMany({
      where: {
        isActive: true,
        endsAt: { gt: new Date() },
        OR: [{ planId }, { planId: null }],
        AND: [{ OR: [{ productId }, { productId: null }] }],
      },
    }),
  ]);
  return { plan, resolved: resolvePrice(plan, override, discounts) };
}

/** اعتبارسنجی کد تخفیف برای اقلام سبد */
export async function validateCoupon(
  code: string,
  ctx: {
    userId: string | null;
    subtotal: number;
    lines: Array<{ productId: string; planId: string; price: number }>;
  },
): Promise<{ ok: true; coupon: Coupon; discount: number } | { ok: false; error: string }> {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!coupon || !coupon.isActive) return { ok: false, error: "کد تخفیف معتبر نیست." };
  if (coupon.startsAt && coupon.startsAt > now)
    return { ok: false, error: "این کد تخفیف هنوز فعال نشده است." };
  if (coupon.endsAt && coupon.endsAt < now)
    return { ok: false, error: "مهلت استفاده از این کد تخفیف تمام شده است." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses)
    return { ok: false, error: "ظرفیت استفاده از این کد تکمیل شده است." };
  if (ctx.userId && coupon.perUserLimit) {
    const used = await db.order.count({
      where: { userId: ctx.userId, couponId: coupon.id, status: "PAID" },
    });
    if (used >= coupon.perUserLimit)
      return { ok: false, error: "شما قبلاً از این کد تخفیف استفاده کرده‌اید." };
  }
  // کوپن محدود به محصول/پلن فقط روی اقلام مشمول اعمال می‌شود
  const eligible = ctx.lines.filter(
    (l) =>
      (!coupon.productIds.length || coupon.productIds.includes(l.productId)) &&
      (!coupon.planIds.length || coupon.planIds.includes(l.planId)),
  );
  if (!eligible.length)
    return { ok: false, error: "این کد تخفیف برای اقلام سبد شما قابل استفاده نیست." };
  const base = eligible.reduce((s, l) => s + l.price, 0);
  if (coupon.minAmount && ctx.subtotal < coupon.minAmount)
    return { ok: false, error: "مبلغ سبد برای استفاده از این کد کافی نیست." };
  const discount = couponDiscount(base, { type: coupon.type, value: coupon.value });
  return { ok: true, coupon, discount };
}

export async function getCartView(): Promise<CartView> {
  const [cartId, settings, userId] = await Promise.all([
    getCartId({ create: false }),
    getSettings(),
    currentUserId(),
  ]);
  const empty: CartView = {
    id: cartId,
    lines: [],
    subtotal: 0,
    coupon: null,
    couponError: null,
    discount: 0,
    taxPercent: settings.taxPercent,
    tax: 0,
    total: 0,
  };
  if (!cartId) return empty;
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!cart?.items.length) return { ...empty, id: cartId };

  const products = await db.product.findMany({
    where: { id: { in: cart.items.map((i) => i.productId) } },
  });
  const lines: CartLine[] = [];
  for (const it of cart.items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) continue;
    const { plan, resolved } = await priceLine(it.productId, it.planId);
    lines.push({
      id: it.id,
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
      industryName: p.industryName,
      icon: p.icon,
      theme: p.theme,
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      price: resolved.price,
      compareAtPrice: resolved.compareAtPrice,
      available: resolved.isAvailable && plan.isActive && p.status === "PUBLISHED",
    });
  }
  const valid = lines.filter((l) => l.available);
  const subtotal = valid.reduce((s, l) => s + l.price, 0);
  let coupon: CartView["coupon"] = null;
  let couponError: string | null = null;
  if (cart.couponCode) {
    const r = await validateCoupon(cart.couponCode, { userId, subtotal, lines: valid });
    if (r.ok) coupon = { code: r.coupon.code, discount: r.discount };
    else couponError = r.error;
  }
  const discount = coupon?.discount ?? 0;
  const { tax, total } = addTax(subtotal - discount, settings.taxPercent);
  return {
    id: cartId,
    lines,
    subtotal,
    coupon,
    couponError,
    discount,
    taxPercent: settings.taxPercent,
    tax,
    total,
  };
}

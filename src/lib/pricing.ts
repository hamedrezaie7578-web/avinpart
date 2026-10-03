/**
 * منطق قیمت‌گذاری — مستقل از دیتابیس تا قابل تست باشد.
 * ترتیب اعمال: قیمت پایه‌ی پلن ← override اختصاصی محصول ← تخفیف زمان‌دار ← کوپن
 */

export type PlanPriceInput = { price: number; compareAtPrice?: number | null };
export type ProductOverrideInput = {
  price?: number | null;
  compareAtPrice?: number | null;
  isAvailable?: boolean;
} | null;
export type TimedDiscountInput = {
  percent?: number | null;
  amount?: number | null;
  label?: string | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};

export type ResolvedPrice = {
  /** قیمت نهایی قابل پرداخت (تومان) */
  price: number;
  /** قیمت خط‌خورده؛ فقط اگر بیشتر از قیمت نهایی باشد */
  compareAtPrice: number | null;
  discountPercent: number | null;
  discountLabel: string | null;
  discountEndsAt: Date | null;
  isAvailable: boolean;
};

function applyDiscount(price: number, d: Pick<TimedDiscountInput, "percent" | "amount">): number {
  let p = price;
  if (d.percent) p = p - Math.round((p * Math.min(100, Math.max(0, d.percent))) / 100);
  if (d.amount) p = p - d.amount;
  return Math.max(0, p);
}

/** گرد کردن به نزدیک‌ترین هزار تومان (قیمت‌های تمیز در UI) */
export function roundToman(value: number, step = 1000): number {
  return Math.round(value / step) * step;
}

export function resolvePrice(
  plan: PlanPriceInput,
  override: ProductOverrideInput = null,
  discounts: TimedDiscountInput[] = [],
  now: Date = new Date(),
): ResolvedPrice {
  const base = override?.price ?? plan.price;
  const listCompare =
    override?.compareAtPrice ?? (override?.price != null ? null : (plan.compareAtPrice ?? null));

  // بهترین تخفیف فعال برای مشتری
  const active = discounts.filter((d) => d.isActive && d.startsAt <= now && d.endsAt > now);
  let best: TimedDiscountInput | null = null;
  let bestPrice = base;
  for (const d of active) {
    const p = applyDiscount(base, d);
    if (p < bestPrice) {
      bestPrice = p;
      best = d;
    }
  }
  const price = best ? roundToman(bestPrice) : base;
  const compareCandidate = best ? Math.max(base, listCompare ?? 0) : listCompare;
  const compareAtPrice = compareCandidate && compareCandidate > price ? compareCandidate : null;

  return {
    price,
    compareAtPrice,
    discountPercent: compareAtPrice
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null,
    discountLabel: best?.label ?? null,
    discountEndsAt: best?.endsAt ?? null,
    isAvailable: override?.isAvailable ?? true,
  };
}

export type CouponInput = {
  type: "PERCENT" | "AMOUNT";
  value: number;
  minAmount?: number | null;
};

/** مبلغ تخفیف کوپن روی جمع سبد */
export function couponDiscount(subtotal: number, coupon: CouponInput): number {
  if (coupon.minAmount && subtotal < coupon.minAmount) return 0;
  const raw =
    coupon.type === "PERCENT"
      ? Math.round((subtotal * Math.min(100, coupon.value)) / 100)
      : coupon.value;
  return Math.min(subtotal, Math.max(0, raw));
}

/**
 * مابه‌التفاوت ارتقای پلن: کاربر قیمت پرداخت‌شده‌ی قبلی را (برای پلن دائمی کامل،
 * برای پلن دوره‌ای به نسبت روزهای باقی‌مانده) از قیمت پلن جدید کم می‌کند.
 */
export function upgradeDifference(params: {
  newPrice: number;
  paidPrice: number;
  /** null = لایسنس دائمی */
  expiresAt: Date | null;
  startedAt: Date;
  now?: Date;
}): number {
  const { newPrice, paidPrice, expiresAt, startedAt, now = new Date() } = params;
  let credit = paidPrice;
  if (expiresAt) {
    const total = expiresAt.getTime() - startedAt.getTime();
    const left = Math.max(0, expiresAt.getTime() - now.getTime());
    credit = total > 0 ? Math.round((paidPrice * left) / total) : 0;
  }
  return roundToman(Math.max(0, newPrice - credit));
}

/** ارزش افزوده */
export function addTax(amount: number, percent: number): { tax: number; total: number } {
  const tax = Math.round((amount * percent) / 100);
  return { tax, total: amount + tax };
}

/**
 * سیستم تم رنگی محصولات.
 * هر محصول یک پالت (ProductTheme) در دیتابیس دارد که به CSS Variables تبدیل می‌شود
 * و همه‌ی کامپوننت‌های لندینگ از طریق کلاس‌هایی مثل `bg-brand` و `text-brand-fg` از آن استفاده می‌کنند.
 */
import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "رنگ باید به فرمت #RRGGBB باشد");

export const themeSchema = z.object({
  /** رنگ اصلی (دکمه‌ها، لینک‌ها، تأکیدها) */
  primary: hex,
  /** رنگ متن روی primary */
  primaryFg: hex,
  /** رنگ مکمل (نشان‌ها، آیکون‌ها، هایلایت‌ها) */
  secondary: hex,
  /** رنگ متن روی secondary */
  secondaryFg: hex,
  /** پس‌زمینه‌ی ملایم سکشن‌ها در حالت روشن */
  surface: hex,
  /** رنگ‌های گرادیان هیرو */
  gradientFrom: hex,
  gradientTo: hex,
  /** رنگ متن روی گرادیان هیرو */
  heroFg: hex,
});

export type ProductTheme = z.infer<typeof themeSchema>;

// ───────── محاسبات رنگ و کنتراست (WCAG 2.1) ─────────

export function hexToRgb(color: string): [number, number, number] {
  let v = color.replace("#", "");
  if (v.length === 3)
    v = v
      .split("")
      .map((c) => c + c)
      .join("");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as [number, number, number];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((c) =>
        Math.round(Math.max(0, Math.min(255, c)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(color: string): number {
  const [r, g, b] = hexToRgb(color);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

/** حداقل کنتراست WCAG AA: متن عادی ۴٫۵ و متن درشت ۳ */
export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;

export type ContrastIssue = { pair: string; ratio: number; required: number };

/** بررسی همه‌ی جفت‌رنگ‌های حساس یک تم */
export function auditTheme(theme: ProductTheme): ContrastIssue[] {
  const checks: Array<[string, string, string, number]> = [
    ["primaryFg / primary", theme.primaryFg, theme.primary, WCAG_AA_NORMAL],
    ["secondaryFg / secondary", theme.secondaryFg, theme.secondary, WCAG_AA_NORMAL],
    ["heroFg / gradientFrom", theme.heroFg, theme.gradientFrom, WCAG_AA_NORMAL],
    ["heroFg / gradientTo", theme.heroFg, theme.gradientTo, WCAG_AA_LARGE],
    // متن رنگی primary روی پس‌زمینه‌ی surface (تیترهای کوچک و لینک‌ها)
    ["primary / surface", theme.primary, theme.surface, WCAG_AA_LARGE],
  ];
  return checks
    .map(([pair, fg, bg, required]) => ({ pair, ratio: contrastRatio(fg, bg), required }))
    .filter((c) => c.ratio < c.required);
}

/** برای متن روی یک رنگ دلخواه، مشکی یا سفید انتخاب می‌کند */
export function readableOn(bg: string): string {
  return contrastRatio("#ffffff", bg) >= contrastRatio("#0b0b0f", bg) ? "#ffffff" : "#0b0b0f";
}

/** ترکیب دو رنگ (amount=0 → a ، amount=1 → b) */
export function mix(a: string, b: string, amount: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return rgbToHex(
    [0, 1, 2].map((i) => ra[i]! + (rb[i]! - ra[i]!) * amount) as [number, number, number],
  );
}

/**
 * روشن‌کردن رنگ تا رسیدن به کنتراست مطلوب روی پس‌زمینه‌ی تیره —
 * برای ساخت خودکار نسخه‌ی حالت تاریک رنگ primary.
 */
export function ensureContrast(color: string, bg: string, target: number): string {
  if (contrastRatio(color, bg) >= target) return color;
  const towards = luminance(bg) < 0.5 ? "#ffffff" : "#000000";
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = mix(color, towards, t);
    if (contrastRatio(c, bg) >= target) return c;
  }
  return towards;
}

const DARK_BG = "#0b0d14";

/** تبدیل تم به CSS Variables برای استفاده در style یک wrapper */
export function themeToCssVars(theme: ProductTheme): Record<string, string> {
  const primaryOnDark = ensureContrast(theme.primary, DARK_BG, WCAG_AA_NORMAL);
  // مقادیر روشن/تاریک با نام جدا ثبت می‌شوند و globals.css بر اساس حالت تم یکی را انتخاب می‌کند
  // (اگر --brand مستقیم inline شود، قانون حالت تاریک نمی‌تواند آن را بازنویسی کند)
  return {
    "--p-brand": theme.primary,
    "--p-brand-fg": theme.primaryFg,
    "--p-surface": theme.surface,
    "--p-brand-dark": primaryOnDark,
    "--p-brand-dark-fg": readableOn(primaryOnDark),
    "--p-surface-dark": mix(DARK_BG, theme.primary, 0.12),
    "--brand-2": theme.secondary,
    "--brand-2-fg": theme.secondaryFg,
    "--brand-from": theme.gradientFrom,
    "--brand-to": theme.gradientTo,
    "--brand-hero-fg": theme.heroFg,
  };
}

/** تم برند اصلی AvinApps (آبی-بنفش) */
export const BRAND_THEME: ProductTheme = {
  primary: "#4f46e5",
  primaryFg: "#ffffff",
  secondary: "#7c3aed",
  secondaryFg: "#ffffff",
  surface: "#f5f3ff",
  gradientFrom: "#1e40af",
  gradientTo: "#6d28d9",
  heroFg: "#ffffff",
};

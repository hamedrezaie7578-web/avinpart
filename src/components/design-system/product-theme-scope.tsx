import type { CSSProperties, ReactNode } from "react";
import { themeSchema, themeToCssVars, BRAND_THEME, type ProductTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * محدوده‌ی تم یک محصول: همه‌ی کلاس‌های brand-* داخل این wrapper رنگ همان صنف را می‌گیرند.
 * تم نامعتبر (مثلاً داده‌ی خراب در DB) به تم برند اصلی برمی‌گردد.
 */
export function ProductThemeScope({
  theme,
  className,
  children,
}: {
  theme: unknown;
  className?: string;
  children: ReactNode;
}) {
  const parsed = themeSchema.safeParse(theme);
  const value: ProductTheme = parsed.success ? parsed.data : BRAND_THEME;
  return (
    <div
      data-product-theme
      className={cn(className)}
      style={themeToCssVars(value) as CSSProperties}
    >
      {children}
    </div>
  );
}

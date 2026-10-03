import { format as formatJalali, formatDistanceToNow } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** تبدیل ارقام لاتین به فارسی */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]!);
}

/** تبدیل ارقام فارسی/عربی به لاتین (برای ورودی کاربر مثل موبایل و OTP) */
export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

const numberFormatter = new Intl.NumberFormat("fa-IR");

/** عدد با جداکننده‌ی هزارگان و ارقام فارسی: ۱۰٬۰۰۰٬۰۰۰ */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** قیمت به تومان: «۱۰٬۰۰۰٬۰۰۰ تومان» */
export function formatPrice(toman: number, opts: { suffix?: boolean } = {}): string {
  const { suffix = true } = opts;
  return suffix ? `${formatNumber(toman)} تومان` : formatNumber(toman);
}

/** نمایش کوتاه قیمت: «۶۰ میلیون تومان» */
export function formatPriceShort(toman: number): string {
  if (toman >= 1_000_000_000)
    return `${formatNumber(+(toman / 1_000_000_000).toFixed(1))} میلیارد تومان`;
  if (toman >= 1_000_000) return `${formatNumber(+(toman / 1_000_000).toFixed(1))} میلیون تومان`;
  if (toman >= 1_000) return `${formatNumber(Math.round(toman / 1_000))} هزار تومان`;
  return formatPrice(toman);
}

/** تاریخ شمسی؛ پیش‌فرض: «۱۲ مهر ۱۴۰۵» */
export function formatDate(date: Date | string | number, pattern = "d MMMM yyyy"): string {
  return toFaDigits(formatJalali(new Date(date), pattern, { locale: faIR }));
}

export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, "d MMMM yyyy، HH:mm");
}

/** «۳ روز پیش» */
export function formatRelative(date: Date | string | number): string {
  return toFaDigits(formatDistanceToNow(new Date(date), { addSuffix: true, locale: faIR }));
}

/** نرمال‌سازی شماره موبایل ایران به فرمت 09xxxxxxxxx؛ در صورت نامعتبر بودن null */
export function normalizeMobile(input: string): string | null {
  let m = toEnDigits(input).replace(/[\s\-()]/g, "");
  if (m.startsWith("+98")) m = "0" + m.slice(3);
  else if (m.startsWith("0098")) m = "0" + m.slice(4);
  else if (m.startsWith("98") && m.length === 12) m = "0" + m.slice(2);
  else if (m.startsWith("9") && m.length === 10) m = "0" + m;
  return /^09\d{9}$/.test(m) ? m : null;
}

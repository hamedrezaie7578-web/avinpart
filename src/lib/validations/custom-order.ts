import { z } from "zod";
import { mobileSchema } from "./lead";

export const PROJECT_TYPES = [
  { value: "accounting", label: "نرم‌افزار حسابداری / مدیریتی اختصاصی" },
  { value: "erp", label: "ERP سفارشی (تولید، انبار، مالی)" },
  { value: "crm", label: "CRM و مدیریت ارتباط با مشتری" },
  { value: "android", label: "اپلیکیشن اندروید" },
  { value: "webapp", label: "وب‌اپلیکیشن / پنل تحت وب" },
  { value: "website", label: "وب‌سایت یا فروشگاه اینترنتی اختصاصی" },
  { value: "integration", label: "اتصال به سیستم‌های موجود و API" },
] as const;

export const PLATFORMS = [
  { value: "WINDOWS", label: "ویندوز" },
  { value: "ANDROID", label: "اندروید" },
  { value: "IOS", label: "iOS" },
  { value: "WEB", label: "تحت وب" },
] as const;

export const FEATURE_OPTIONS = [
  "مدیریت کاربران و سطح دسترسی",
  "انبارداری و کنترل موجودی",
  "صدور فاکتور و فروش",
  "حسابداری و گزارش‌های مالی",
  "اتصال به سامانه‌ی مودیان",
  "پرداخت آنلاین",
  "ارسال پیامک و اعلان",
  "گزارش‌گیری و داشبورد مدیریتی",
  "اپ موبایل برای مشتریان یا پرسنل",
  "اتصال به سخت‌افزار (بارکدخوان، ترازو، پوز)",
  "چند شعبه‌ای / چند انباره",
  "اتصال به نرم‌افزار یا API موجود",
] as const;

export const BUDGETS = [
  { value: "lt-100", label: "کمتر از ۱۰۰ میلیون تومان" },
  { value: "100-300", label: "۱۰۰ تا ۳۰۰ میلیون تومان" },
  { value: "300-700", label: "۳۰۰ تا ۷۰۰ میلیون تومان" },
  { value: "gt-700", label: "بیش از ۷۰۰ میلیون تومان" },
  { value: "unknown", label: "هنوز مشخص نیست؛ نیاز به مشاوره دارم" },
] as const;

export const TIMELINES = [
  { value: "urgent", label: "فوری (کمتر از ۱ ماه)" },
  { value: "1-3", label: "۱ تا ۳ ماه" },
  { value: "3-6", label: "۳ تا ۶ ماه" },
  { value: "flexible", label: "زمان‌بندی منعطف است" },
] as const;

const vals = <T extends readonly { value: string }[]>(arr: T) =>
  arr.map((a) => a.value) as [T[number]["value"], ...T[number]["value"][]];

export const customOrderSteps = {
  contact: z.object({
    contactName: z.string().trim().min(2, "نام را کامل وارد کنید").max(80),
    mobile: mobileSchema,
    email: z.string().trim().email("ایمیل معتبر نیست").max(120).optional().or(z.literal("")),
    businessName: z.string().trim().max(120).optional().or(z.literal("")),
    businessField: z.string().trim().min(2, "حوزه‌ی فعالیت را بنویسید").max(120),
  }),
  project: z.object({
    projectTypes: z.array(z.enum(vals(PROJECT_TYPES))).min(1, "حداقل یک نوع پروژه را انتخاب کنید"),
    platforms: z.array(z.enum(vals(PLATFORMS))).min(1, "حداقل یک پلتفرم را انتخاب کنید"),
  }),
  needs: z.object({
    features: z.array(z.string().max(80)).max(30),
    description: z
      .string()
      .trim()
      .min(30, "لطفاً نیازتان را کمی کامل‌تر توضیح دهید (حداقل ۳۰ کاراکتر)")
      .max(5000),
  }),
  budget: z.object({
    budgetRange: z.enum(vals(BUDGETS), { error: "بودجه‌ی تقریبی را انتخاب کنید" }),
    timeline: z.enum(vals(TIMELINES), { error: "زمان‌بندی را انتخاب کنید" }),
  }),
  files: z.object({ attachmentIds: z.array(z.string().max(40)).max(5) }),
};

export const customOrderSchema = customOrderSteps.contact
  .extend(customOrderSteps.project.shape)
  .extend(customOrderSteps.needs.shape)
  .extend(customOrderSteps.budget.shape)
  .extend(customOrderSteps.files.shape)
  .extend({
    type: z.enum(["CUSTOM_SOFTWARE", "WEBSITE"]).default("CUSTOM_SOFTWARE"),
    website: z.string().max(0).optional().or(z.literal("")),
  });

export type CustomOrderInput = z.input<typeof customOrderSchema>;

export function labelOf<T extends readonly { value: string; label: string }[]>(arr: T, v: string) {
  return arr.find((a) => a.value === v)?.label ?? v;
}

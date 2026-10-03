/**
 * اسکیمای داده‌ی هر نوع سکشن لندینگ (Section builder).
 * داده‌ی هر سکشن در LandingSection.data (JSON) ذخیره و هنگام رندر با این اسکیماها اعتبارسنجی می‌شود.
 */
import { z } from "zod";

const cta = z.object({ label: z.string(), href: z.string() });
const item = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().default("Sparkles"),
});

export const sectionSchemas = {
  HERO: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    highlight: z.string().optional(),
    subtitle: z.string(),
    primaryCta: cta.optional(),
    secondaryCta: cta.optional(),
    bullets: z.array(z.string()).default([]),
    mockup: z
      .object({
        kpis: z.array(
          z.object({ label: z.string(), value: z.number(), suffix: z.string().optional() }),
        ),
        rows: z.array(z.object({ title: z.string(), amount: z.number() })),
      })
      .optional(),
  }),
  PAIN_POINTS: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    items: z.array(item),
  }),
  FEATURES: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
  }),
  MODULES: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    items: z.array(item).optional(),
  }),
  PLATFORMS: z.object({ title: z.string(), description: z.string().optional() }),
  GALLERY: z.object({ title: z.string(), description: z.string().optional() }),
  PRICING: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
  }),
  STATS: z.object({
    title: z.string().optional(),
    items: z
      .array(z.object({ value: z.number(), suffix: z.string().optional(), label: z.string() }))
      .optional(),
  }),
  TESTIMONIALS: z.object({ title: z.string(), description: z.string().optional() }),
  VIDEO: z.object({
    title: z.string(),
    description: z.string().optional(),
    embedUrl: z.string().url(),
  }),
  FAQ: z.object({ title: z.string(), description: z.string().optional() }),
  CTA: z.object({
    title: z.string(),
    description: z.string().optional(),
    withForm: z.boolean().default(true),
  }),
  RELATED: z.object({ title: z.string() }),
  RICH_TEXT: z.object({ title: z.string().optional(), html: z.string() }),
} as const;

export type SectionType = keyof typeof sectionSchemas;
export type SectionData<T extends SectionType> = z.infer<(typeof sectionSchemas)[T]>;
export type ParsedSection = {
  [K in SectionType]: { id: string; type: K; data: SectionData<K> };
}[SectionType];

export const SECTION_LABELS: Record<SectionType, string> = {
  HERO: "هیرو",
  PAIN_POINTS: "دردهای صنف",
  FEATURES: "امکانات کلیدی",
  MODULES: "ماژول‌ها",
  PLATFORMS: "سه نسخه‌ی نرم‌افزار",
  GALLERY: "گالری تصاویر",
  PRICING: "پلن‌ها و قیمت",
  STATS: "آمار و اعتماد",
  TESTIMONIALS: "نظرات مشتریان",
  VIDEO: "ویدیوی معرفی",
  FAQ: "سؤالات متداول",
  CTA: "دعوت به اقدام + فرم",
  RELATED: "محصولات و مقالات مرتبط",
  RICH_TEXT: "متن آزاد",
};

/** اعتبارسنجی امن؛ سکشن خراب به‌جای کرش صفحه نادیده گرفته می‌شود */
export function parseSection(s: { id: string; type: string; data: unknown }): ParsedSection | null {
  const schema = sectionSchemas[s.type as SectionType];
  if (!schema) return null;
  const r = schema.safeParse(s.data);
  if (!r.success) {
    console.warn(`[sections] داده‌ی نامعتبر برای سکشن ${s.type} (${s.id})`, r.error.issues[0]);
    return null;
  }
  return { id: s.id, type: s.type, data: r.data } as ParsedSection;
}

/** ماژول‌های عمومی مشترک بین همه‌ی محصولات */
export const DEFAULT_MODULES: Array<z.infer<typeof item>> = [
  {
    icon: "Warehouse",
    title: "انبارداری",
    description: "موجودی لحظه‌ای چند انبار، کاردکس کالا، انبارگردانی و هشدار نقطه‌ی سفارش.",
  },
  {
    icon: "Receipt",
    title: "فروش و صدور فاکتور",
    description: "فاکتور رسمی و فروشگاهی، پیش‌فاکتور، مرجوعی و تخفیف ردیفی و کلی در چند ثانیه.",
  },
  {
    icon: "ShoppingCart",
    title: "خرید",
    description: "ثبت فاکتور خرید، قیمت تمام‌شده، حساب تأمین‌کنندگان و برگشت از خرید.",
  },
  {
    icon: "Users",
    title: "اشخاص و باشگاه مشتریان",
    description: "پرونده‌ی کامل مشتری و تأمین‌کننده، سقف اعتبار، امتیاز وفاداری و پیامک مناسبتی.",
  },
  {
    icon: "Landmark",
    title: "چک و بانک",
    description: "چک‌های دریافتی و پرداختی، سررسید، واگذاری به بانک و کنترل موجودی حساب‌ها.",
  },
  {
    icon: "BarChart3",
    title: "گزارش‌های مدیریتی",
    description: "سود و زیان، پرفروش‌ترین کالاها، گردش حساب و بیش از ۵۰ گزارش آماده و قابل چاپ.",
  },
  {
    icon: "Wallet",
    title: "حقوق و دستمزد",
    description: "محاسبه‌ی حقوق، اضافه‌کار، مساعده و بیمه‌ی پرسنل بر اساس قوانین کار.",
  },
  {
    icon: "FileText",
    title: "سامانه‌ی مودیان مالیاتی",
    description: "صدور و ارسال صورتحساب الکترونیکی به سامانه‌ی مودیان، مستقیم از داخل نرم‌افزار.",
  },
  {
    icon: "CreditCard",
    title: "اتصال به کارت‌خوان",
    description: "ارسال مبلغ فاکتور به پوز بانکی و ثبت خودکار پرداخت بدون تایپ دوباره.",
  },
  {
    icon: "Barcode",
    title: "بارکدخوان و چاپ بارکد",
    description: "فروش سریع با اسکن بارکد و طراحی و چاپ برچسب بارکد برای کالاهای بدون بارکد.",
  },
  {
    icon: "Printer",
    title: "چاپگر فیش و فاکتور",
    description: "چاپ فیش حرارتی ۸ سانتی، فاکتور A4 و A5 با لوگو و قالب دلخواه.",
  },
  {
    icon: "ShieldCheck",
    title: "امنیت و سطح دسترسی",
    description: "تعریف کاربر با دسترسی جداگانه، ثبت تاریخچه‌ی تغییرات و پشتیبان‌گیری خودکار.",
  },
];

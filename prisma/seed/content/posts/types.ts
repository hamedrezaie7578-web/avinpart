export type SeedPost = {
  slug: string;
  title: string;
  /** ۱۲۰ تا ۱۶۰ کاراکتر */
  excerpt: string;
  category: "accounting" | "tax" | "inventory" | "business" | "software";
  tags: string[];
  /** slug محصولات مرتبط (لینک داخلی) */
  products: string[];
  focusKeyword: string;
  seoTitle: string;
  seoDescription: string;
  /** چند روز پیش منتشر شده (برای ترتیب) */
  publishDaysAgo: number;
  /** HTML تمیز: فقط h2, h3, p, ul, ol, li, strong, em, a, blockquote, table */
  html: string;
};

export const POST_CATEGORIES: Record<SeedPost["category"], { name: string; description: string }> = {
  accounting: { name: "حسابداری فروشگاهی", description: "آموزش ساده‌ی حسابداری برای صاحبان فروشگاه و کسب‌وکارهای کوچک." },
  tax: { name: "مالیات و سامانه‌ی مودیان", description: "راهنمای سامانه‌ی مودیان، صورتحساب الکترونیکی و تکالیف مالیاتی کسب‌وکارها." },
  inventory: { name: "انبارداری و موجودی", description: "روش‌های کنترل موجودی، انبارگردانی و کاهش ضرر انبار." },
  business: { name: "مدیریت و رشد کسب‌وکار", description: "قیمت‌گذاری، باشگاه مشتریان، فروش و مدیریت مالی کسب‌وکار." },
  software: { name: "نرم‌افزار و تحول دیجیتال", description: "انتخاب نرم‌افزار، فروش آنلاین و دیجیتالی کردن کسب‌وکار." },
};

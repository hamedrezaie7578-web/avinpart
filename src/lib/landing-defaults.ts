import type { ParsedSection } from "./sections";

type P = { name: string; industryName: string; shortDesc: string };

/**
 * سکشن‌های پیش‌فرض لندینگ برای محصولی که هنوز در Section builder سکشنی ندارد.
 * محتوای اختصاصی هر صنف در فاز محتوا به‌صورت سکشن در دیتابیس ذخیره می‌شود.
 */
export function defaultSections(p: P): ParsedSection[] {
  const id = (t: string) => `default-${t}`;
  return [
    {
      id: id("hero"),
      type: "HERO",
      data: {
        title: `نرم‌افزار حسابداری ${p.industryName}؛`,
        highlight: p.name,
        subtitle: p.shortDesc,
        bullets: [
          "نسخه‌ی ویندوز، اندروید و تحت وب",
          "اتصال به سامانه‌ی مودیان",
          "نصب و آموزش رایگان",
          "پشتیبان‌گیری خودکار",
        ],
      },
    },
    {
      id: id("features"),
      type: "FEATURES",
      data: { title: `امکانات تخصصی ${p.name} برای ${p.industryName}` },
    },
    {
      id: id("modules"),
      type: "MODULES",
      data: { title: "همه‌ی ابزارهای حسابداری که یک کسب‌وکار لازم دارد" },
    },
    {
      id: id("platforms"),
      type: "PLATFORMS",
      data: { title: `${p.name} روی ویندوز، اندروید و وب` },
    },
    { id: id("pricing"), type: "PRICING", data: { title: `قیمت نرم‌افزار ${p.industryName}` } },
    { id: id("stats"), type: "STATS", data: {} },
    {
      id: id("testimonials"),
      type: "TESTIMONIALS",
      data: { title: `نظر همکاران شما درباره‌ی ${p.name}` },
    },
    { id: id("faq"), type: "FAQ", data: { title: `سؤالات متداول درباره‌ی ${p.name}` } },
    {
      id: id("cta"),
      type: "CTA",
      data: {
        title: `${p.name} را رایگان امتحان کنید`,
        description: "دموی آنلاین بگیرید یا نسخه‌ی آزمایشی را نصب کنید؛ بدون هزینه و بدون تعهد.",
        withForm: true,
      },
    },
    { id: id("related"), type: "RELATED", data: { title: "محصولات مرتبط" } },
  ];
}

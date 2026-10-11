import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { CACHE_TAGS } from "./catalog";
import { resolveHomeTexts } from "@/lib/home-texts";

export type SiteSettings = {
  name: string;
  nameFa: string;
  tagline: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  workingHours: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  linkedin: string;
  aparat: string;
  enamadHtml: string;
  samandehiHtml: string;
  stats: { customers: number; years: number; satisfaction: number; industries: number };
  taxPercent: number;
  maintenance: boolean;
};

/** تنظیمات عمومی سایت (غیرمحرمانه) با کش و تگ settings */
export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const rows = await db.setting.findMany({ where: { isSecret: false } });
    const m = new Map(rows.map((r) => [r.key, r.value]));
    const s = (k: string, d = "") => (typeof m.get(k) === "string" ? (m.get(k) as string) : d);
    const n = (k: string, d = 0) => (typeof m.get(k) === "number" ? (m.get(k) as number) : d);
    return {
      name: s("site.name", "AvinApps"),
      nameFa: s("site.nameFa", "آوین اپس"),
      tagline: s("site.tagline"),
      phone: s("contact.phone"),
      mobile: s("contact.mobile"),
      email: s("contact.email"),
      address: s("contact.address"),
      workingHours: s("contact.workingHours"),
      whatsapp: s("social.whatsapp"),
      telegram: s("social.telegram"),
      instagram: s("social.instagram"),
      linkedin: s("social.linkedin"),
      aparat: s("social.aparat"),
      enamadHtml: s("trust.enamadHtml"),
      samandehiHtml: s("trust.samandehiHtml"),
      stats: {
        customers: n("stats.customers"),
        years: n("stats.years"),
        satisfaction: n("stats.satisfaction"),
        industries: n("stats.industries", 26),
      },
      taxPercent: n("billing.taxPercent", 10),
      maintenance: m.get("site.maintenance") === true,
    };
  },
  ["site-settings"],
  { tags: [CACHE_TAGS.settings], revalidate: 3600 },
);

export const getMenu = unstable_cache(
  async (key: string) => {
    const menu = await db.menu.findUnique({
      where: { key },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: "asc" },
          include: { children: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
    return menu?.items ?? [];
  },
  ["menu"],
  { tags: ["menus"], revalidate: 3600 },
);

/** شماره‌ی تماس قابل استفاده در لینک tel: (ارقام لاتین) */
export function telHref(phone: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return "tel:" + phone.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d))).replace(/[^\d+]/g, "");
}

/** متن‌های صفحه‌ی اصلی (قابل ویرایش در پنل → صفحات) */
export const getHomeTexts = unstable_cache(
  async () => {
    const row = await db.setting.findUnique({ where: { key: "home.texts" } });
    return resolveHomeTexts(row?.value);
  },
  ["home-texts"],
  { tags: [CACHE_TAGS.settings], revalidate: 3600 },
);

export type SeoSettings = { defaultTitle: string; defaultDescription: string; googleSiteVerification: string; googleAnalyticsId: string; robotsExtra: string };

/** تنظیمات سئوی سراسری؛ در نبود دیتابیس (مثلاً هنگام build) مقادیر پیش‌فرض برمی‌گردد */
export const getSeoSettings = unstable_cache(
  async (): Promise<SeoSettings> => {
    const d: SeoSettings = {
      defaultTitle: "AvinApps | نرم‌افزار حسابداری و مدیریت کسب‌وکار برای همه‌ی صنف‌ها",
      defaultDescription:
        "نرم‌افزار حسابداری فروشگاهی تخصصی برای هر صنف؛ نسخه‌ی ویندوز، اندروید و تحت وب، اتصال به سامانه‌ی مودیان و طراحی نرم‌افزار و سایت اختصاصی.",
      googleSiteVerification: "",
      googleAnalyticsId: "",
      robotsExtra: "",
    };
    try {
      const rows = await db.setting.findMany({ where: { key: { startsWith: "seo." } } });
      for (const r of rows) {
        const k = r.key.slice(4) as keyof SeoSettings;
        if (k in d && typeof r.value === "string" && r.value) d[k] = r.value;
      }
    } catch {
      // build بدون دیتابیس
    }
    return d;
  },
  ["seo-settings"],
  { tags: [CACHE_TAGS.settings], revalidate: 3600 },
);

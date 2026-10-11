import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SYSTEM_PAGES } from "@/lib/pages";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

/** نقشه‌ی سایت پویا: صفحات ثابت، محصولات منتشرشده، مقالات، دسته‌های وبلاگ و صفحات سفارشی */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/pricing"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/custom-software"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/website-design"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/blog"), changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/download"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/support"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/refund-policy"), changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const [products, posts, cats, pages] = await Promise.all([
      db.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, orderBy: { sortOrder: "asc" } }),
      db.post.findMany({ where: { status: "PUBLISHED", publishAt: { lte: now } }, select: { slug: true, updatedAt: true, cover: { select: { url: true } } }, orderBy: { publishAt: "desc" } }),
      db.postCategory.findMany({ where: { posts: { some: { status: "PUBLISHED" } } }, select: { slug: true } }),
      db.page.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticPages,
      ...products.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.9, images: [absoluteUrl(`/${p.slug}/opengraph-image`)] })),
      ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6, images: [p.cover ? absoluteUrl(p.cover.url) : absoluteUrl(`/blog/${p.slug}/opengraph-image`)] })),
      ...cats.map((c) => ({ url: absoluteUrl(`/blog/category/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
      ...pages.filter((p) => !(p.slug in SYSTEM_PAGES)).map((p) => ({ url: absoluteUrl(`/p/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
    ];
  } catch {
    // build بدون دیتابیس: فقط صفحات ثابت
    return staticPages;
  }
}

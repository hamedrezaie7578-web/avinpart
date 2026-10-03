import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { CACHE_TAGS } from "./catalog";

/** داده‌ی کامل لندینگ یک محصول */
export const getLandingProduct = unstable_cache(
  async (slug: string) =>
    db.product.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        category: true,
        sections: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
        features: { orderBy: { sortOrder: "asc" } },
        screenshots: { orderBy: { sortOrder: "asc" }, include: { media: true } },
        faqs: { orderBy: { sortOrder: "asc" } },
        testimonials: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } },
        related: {
          where: { status: "PUBLISHED" },
          select: {
            slug: true,
            name: true,
            industryName: true,
            shortDesc: true,
            icon: true,
            theme: true,
          },
        },
        posts: {
          where: { status: "PUBLISHED" },
          take: 3,
          orderBy: { publishAt: "desc" },
          select: { slug: true, title: true, excerpt: true, readingMinutes: true },
        },
      },
    }),
  ["landing-product"],
  { tags: [CACHE_TAGS.products], revalidate: 3600 },
);

export type LandingProduct = NonNullable<Awaited<ReturnType<typeof getLandingProduct>>>;

/** محصولات هم‌دسته برای وقتی که محصول مرتبط دستی تعریف نشده */
export const getSiblingProducts = unstable_cache(
  async (productId: string, categoryId: string | null, take = 4) =>
    db.product.findMany({
      where: { status: "PUBLISHED", id: { not: productId }, ...(categoryId ? { categoryId } : {}) },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      take,
      select: {
        slug: true,
        name: true,
        industryName: true,
        shortDesc: true,
        icon: true,
        theme: true,
      },
    }),
  ["sibling-products"],
  { tags: [CACHE_TAGS.products], revalidate: 3600 },
);

export const getHomeData = unstable_cache(
  async () => {
    const [testimonials, faqs, posts] = await Promise.all([
      db.testimonial.findMany({
        where: { isPublished: true, productId: null },
        orderBy: { sortOrder: "asc" },
        take: 6,
      }),
      db.faq.findMany({
        where: { productId: null, group: { in: ["general", "payment", "license"] } },
        orderBy: { sortOrder: "asc" },
      }),
      db.post.findMany({
        where: { status: "PUBLISHED", publishAt: { lte: new Date() } },
        orderBy: { publishAt: "desc" },
        take: 3,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          readingMinutes: true,
          publishAt: true,
          category: { select: { name: true } },
        },
      }),
    ]);
    return { testimonials, faqs, posts };
  },
  ["home-data"],
  { tags: [CACHE_TAGS.products, "content", "posts"], revalidate: 3600 },
);

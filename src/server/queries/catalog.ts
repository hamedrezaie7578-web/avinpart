import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { resolvePrice } from "@/lib/pricing";

export const CACHE_TAGS = { products: "products", plans: "plans", settings: "settings" } as const;

export const getPublishedProducts = unstable_cache(
  () =>
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        industryName: true,
        shortDesc: true,
        icon: true,
        theme: true,
        isFeatured: true,
        category: { select: { slug: true, name: true } },
      },
    }),
  ["published-products"],
  { tags: [CACHE_TAGS.products], revalidate: 3600 },
);

export const getPlansWithComparison = unstable_cache(
  async () => {
    const [plans, features, highlights, discounts] = await Promise.all([
      db.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.comparisonFeature.findMany({ orderBy: { sortOrder: "asc" }, include: { values: true } }),
      db.setting.findMany({ where: { key: { startsWith: "plan." } } }),
      db.timedDiscount.findMany({ where: { isActive: true, endsAt: { gt: new Date() } } }),
    ]);
    const hl = new Map(highlights.map((s) => [s.key, s.value as string[]]));
    return {
      plans: plans.map((p) => ({
        ...p,
        highlights: hl.get(`plan.${p.code}.highlights`) ?? [],
        discounts: discounts.filter((d) => d.planId === p.id || d.planId === null),
      })),
      rows: features.map((f) => ({
        group: f.group,
        title: f.title,
        values: plans.map((p) => {
          const v = f.values.find((x) => x.planId === p.id);
          return { included: v?.included ?? false, note: v?.note ?? null };
        }),
      })),
    };
  },
  ["plans-comparison"],
  { tags: [CACHE_TAGS.plans], revalidate: 3600 },
);

/** قیمت‌های پلن‌ها برای یک محصول (با override و تخفیف‌های زمان‌دار) */
export async function getProductPricing(productId: string | null) {
  const { plans, rows } = await getPlansWithComparison();
  const overrides = productId ? await db.productPlanPrice.findMany({ where: { productId } }) : [];
  return {
    rows,
    plans: plans.map((p) => {
      const o = overrides.find((x) => x.planId === p.id) ?? null;
      // unstable_cache تاریخ‌ها را به رشته تبدیل می‌کند؛ اینجا دوباره Date می‌سازیم
      const ds = p.discounts
        .filter((d) => !d.productId || d.productId === productId)
        .map((d) => ({ ...d, startsAt: new Date(d.startsAt), endsAt: new Date(d.endsAt) }));
      return { ...p, resolved: resolvePrice(p, o, ds) };
    }),
  };
}

import type { Prisma, PrismaClient, SectionType } from "@prisma/client";
import { landings } from "./content/landings";
import type { LandingContent } from "./content/types";
import { sectionSchemas } from "../../src/lib/sections";

/** تبدیل محتوای یک لندینگ به سکشن‌های Section builder (ترتیب ساختار درخواستی) */
function toSections(c: LandingContent): Array<{ type: SectionType; data: unknown }> {
  return [
    { type: "HERO", data: c.hero },
    { type: "PAIN_POINTS", data: c.pain },
    { type: "FEATURES", data: { title: c.features.title, description: c.features.description } },
    { type: "MODULES", data: c.modules },
    { type: "PLATFORMS", data: c.platforms },
    { type: "GALLERY", data: { title: "نگاهی به محیط نرم‌افزار" } },
    { type: "PRICING", data: c.pricing },
    { type: "STATS", data: {} },
    { type: "TESTIMONIALS", data: { title: "تجربه‌ی همکاران شما" } },
    { type: "RICH_TEXT", data: c.article },
    { type: "FAQ", data: { title: "سؤالات متداول" } },
    { type: "CTA", data: { ...c.cta, withForm: true } },
    { type: "RELATED", data: { title: "محصولات و مقالات مرتبط" } },
  ];
}

export async function seedLandings(db: PrismaClient) {
  let created = 0;
  for (const c of landings) {
    const product = await db.product.findUnique({
      where: { slug: c.slug },
      include: { _count: { select: { sections: true } } },
    });
    if (!product) throw new Error(`محصول ${c.slug} یافت نشد`);
    // محتوایی که از پنل مدیریت ویرایش شده بازنویسی نمی‌شود
    if (product._count.sections > 0) continue;

    const sections = toSections(c);
    for (const s of sections) {
      const r = sectionSchemas[s.type].safeParse(s.data);
      if (!r.success)
        throw new Error(`سکشن ${s.type} در ${c.slug} نامعتبر است: ${r.error.issues[0]?.message}`);
    }
    const related = await db.product.findMany({
      where: { slug: { in: c.related } },
      select: { id: true },
    });

    await db.$transaction([
      db.landingSection.createMany({
        data: sections.map((s, i) => ({
          productId: product.id,
          type: s.type,
          sortOrder: i,
          data: s.data as Prisma.InputJsonValue,
        })),
      }),
      db.productFeature.deleteMany({ where: { productId: product.id } }),
      db.productFeature.createMany({
        data: c.features.items.map((f, i) => ({
          ...f,
          productId: product.id,
          isKey: true,
          sortOrder: i,
        })),
      }),
      db.faq.deleteMany({ where: { productId: product.id } }),
      db.faq.createMany({
        data: c.faqs.map((f, i) => ({ ...f, productId: product.id, sortOrder: i })),
      }),
      db.testimonial.deleteMany({ where: { productId: product.id } }),
      db.testimonial.createMany({
        data: c.testimonials.map((t, i) => ({
          ...t,
          productId: product.id,
          isSample: true,
          sortOrder: i,
        })),
      }),
      db.product.update({
        where: { id: product.id },
        data: {
          related: { set: related.map((r) => ({ id: r.id })) },
          ratingValue: c.rating?.value ?? null,
          ratingCount: c.rating?.count ?? null,
        },
      }),
    ]);
    created++;
  }
  console.log(`✔ محتوای ${created} لندینگ (از ${landings.length})`);
}

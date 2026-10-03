import { describe, expect, it } from "vitest";
import { landings } from "../../prisma/seed/content/landings";
import type { LandingContent } from "../../prisma/seed/content/types";
import { products } from "../../prisma/seed/data/products";
import { isIconName } from "@/components/design-system/icon";
import { sectionSchemas } from "@/lib/sections";

function words(text: string) {
  return text
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** شمارش کلمات کل محتوای منحصربه‌فرد یک لندینگ */
export function landingWordCount(c: LandingContent): number {
  const parts = [
    c.hero.title,
    c.hero.highlight ?? "",
    c.hero.subtitle,
    ...c.hero.bullets,
    c.pain.title,
    c.pain.description,
    ...c.pain.items.flatMap((i) => [i.title, i.description]),
    c.features.title,
    c.features.description,
    ...c.features.items.flatMap((i) => [i.title, i.description]),
    c.modules.title,
    c.modules.description,
    c.platforms.title,
    c.platforms.description,
    c.pricing.title,
    c.pricing.description,
    ...c.testimonials.map((t) => t.body),
    ...c.faqs.flatMap((f) => [f.question, f.answer]),
    c.article.title,
    c.article.html,
    c.cta.title,
    c.cta.description,
  ];
  return parts.reduce((n, p) => n + words(p), 0);
}

describe.each(landings.map((l) => [l.slug, l] as const))("landing %s", (slug, c) => {
  it("belongs to a seeded product", () => expect(products.some((p) => p.slug === slug)).toBe(true));
  it("has valid section data", () => {
    expect(sectionSchemas.HERO.safeParse(c.hero).success).toBe(true);
    expect(sectionSchemas.PAIN_POINTS.safeParse(c.pain).success).toBe(true);
    expect(sectionSchemas.RICH_TEXT.safeParse(c.article).success).toBe(true);
  });
  it("meets content requirements", () => {
    expect(c.pain.items.length).toBeGreaterThanOrEqual(4);
    expect(c.features.items.length).toBeGreaterThanOrEqual(12);
    expect(c.faqs.length).toBeGreaterThanOrEqual(8);
    expect(landingWordCount(c)).toBeGreaterThanOrEqual(1200);
  });
  it("uses only registered icons", () => {
    for (const i of [...c.pain.items, ...c.features.items])
      expect(isIconName(i.icon), i.icon).toBe(true);
  });
  it("links to existing related products", () => {
    for (const r of c.related)
      expect(
        products.some((p) => p.slug === r),
        r,
      ).toBe(true);
  });
});

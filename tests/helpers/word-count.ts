import type { LandingContent } from "../../prisma/seed/content/types";

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

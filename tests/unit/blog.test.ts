/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import type { SeedPost } from "../../prisma/seed/content/posts/types";
import { products } from "../../prisma/seed/data/products";
import { addHeadingIds, countWords, extractToc, seoAnalysis, stripTags } from "@/lib/blog";

const mods = import.meta.glob<{ default: SeedPost }>("../../prisma/seed/content/posts/*.ts", { eager: true });
const posts = Object.entries(mods)
  .filter(([f]) => !f.endsWith("types.ts"))
  .map(([, m]) => m.default);

describe("blog helpers", () => {
  it("adds unique heading ids and builds a TOC", () => {
    const html = addHeadingIds("<h2>مقدمه</h2><p>x</p><h3>جزئیات بیشتر</h3><h2>مقدمه</h2>");
    expect(html).toContain('<h2 id="مقدمه">');
    expect(html).toContain('<h2 id="مقدمه-2">');
    expect(extractToc(html)).toEqual([
      { id: "مقدمه", text: "مقدمه", level: 2 },
      { id: "جزئیات-بیشتر", text: "جزئیات بیشتر", level: 3 },
      { id: "مقدمه-2", text: "مقدمه", level: 2 },
    ]);
  });
  it("counts Persian words and ignores punctuation", () => {
    expect(countWords(stripTags("<p>سلام، دنیا! — ۱۲۳</p>"))).toBe(3);
  });
  it("scores an empty post low", () => {
    expect(seoAnalysis({ title: "", slug: "", excerpt: "", html: "", hasCover: false }).score).toBeLessThan(20);
  });
});

it("has 10 seeded articles with unique slugs", () => {
  expect(posts.length).toBe(10);
  expect(new Set(posts.map((p) => p.slug)).size).toBe(10);
});

describe.each(posts.map((p) => [p.slug, p] as const))("article %s", (_slug, p) => {
  const html = addHeadingIds(p.html);
  const seo = seoAnalysis({ ...p, html, hasCover: true });
  it("is at least 1500 words", () => expect(seo.words).toBeGreaterThanOrEqual(1500));
  it("passes every SEO check", () => {
    const failed = seo.checks.filter((c) => !c.ok).map((c) => c.label);
    expect(failed).toEqual([]);
  });
  it("uses only allowed HTML tags", () => {
    const tags = new Set([...p.html.matchAll(/<\/?([a-z0-9]+)/g)].map((m) => m[1]));
    for (const t of tags) expect(["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "a", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "br"]).toContain(t);
    expect(p.html).not.toMatch(/style=|class=/);
  });
  it("links only to existing products and articles", () => {
    const slugs = new Set(products.map((x) => x.slug));
    for (const s of p.products) expect(slugs.has(s), s).toBe(true);
    for (const [, href] of p.html.matchAll(/href="\/([a-z0-9-]+)(?:[#?"]|")/g)) {
      const known = ["pricing", "custom-software", "contact", "products", "website-design", "faq", "download", "blog", "about", "support"];
      expect(slugs.has(href!) || known.includes(href!), href).toBe(true);
    }
    const postSlugs = new Set(posts.map((x) => x.slug));
    for (const [, s] of p.html.matchAll(/href="\/blog\/([a-z0-9-]+)"/g)) expect(postSlugs.has(s!), s).toBe(true);
  });
});

import { reshape, visualWord } from "@/lib/reshape";
describe("OG reshaper", () => {
  it("picks contextual forms", () => {
    // ب (اول) + ا (آخر) — «با»
    expect(reshape("با")).toBe("ﺑﺎ");
    expect(reshape("لا")).toBe("ﻻ");
  });
  it("keeps digits and Latin in order", () => {
    expect(visualWord("۲۶")).toBe("۲۶");
    expect(visualWord("AvinGold")).toBe("AvinGold");
    expect(visualWord("۱۲٪")).toBe("۱۲٪");
  });
});

import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { POST_CATEGORIES, type SeedPost } from "./content/posts/types";
import { addHeadingIds, countWords, readingMinutes, seoAnalysis, stripTags } from "../../src/lib/blog";

const CATEGORY_SLUG: Record<SeedPost["category"], string> = {
  accounting: "accounting",
  tax: "tax-moadian",
  inventory: "inventory",
  business: "business-growth",
  software: "software",
};

async function loadPosts(): Promise<SeedPost[]> {
  const dir = path.join(__dirname, "content/posts");
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "types.ts" && f !== "index.ts");
  const mods = await Promise.all(files.map((f) => import(path.join(dir, f)) as Promise<{ default: SeedPost }>));
  return mods.map((m) => m.default);
}

/** مقالات وبلاگ: فقط اگر وجود نداشته باشند ساخته می‌شوند تا ویرایش‌های پنل بازنویسی نشود */
export async function seedPosts(db: PrismaClient) {
  const posts = await loadPosts();
  const author = await db.user.findFirstOrThrow({ where: { type: "ADMIN" }, orderBy: { createdAt: "asc" } });
  const cats = new Map<string, string>();
  for (const [key, c] of Object.entries(POST_CATEGORIES)) {
    const slug = CATEGORY_SLUG[key as SeedPost["category"]];
    const row = await db.postCategory.upsert({ where: { slug }, update: {}, create: { slug, name: c.name, description: c.description } });
    cats.set(key, row.id);
  }
  let created = 0;
  for (const p of posts) {
    if (await db.post.findUnique({ where: { slug: p.slug } })) continue;
    const html = addHeadingIds(p.html.trim());
    const words = countWords(stripTags(html));
    const tagIds: string[] = [];
    for (const name of p.tags) {
      const slug = `t-${createHash("sha1").update(name).digest("hex").slice(0, 8)}`;
      tagIds.push((await db.tag.upsert({ where: { slug }, update: {}, create: { slug, name } })).id);
    }
    const products = await db.product.findMany({ where: { slug: { in: p.products } }, select: { id: true } });
    const seo = seoAnalysis({ ...p, html, hasCover: false });
    await db.post.create({
      data: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: { html },
        contentHtml: html,
        readingMinutes: readingMinutes(words),
        authorId: author.id,
        categoryId: cats.get(p.category),
        status: "PUBLISHED",
        publishAt: new Date(Date.now() - p.publishDaysAgo * 864e5),
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        focusKeyword: p.focusKeyword,
        seoScore: seo.score,
        tags: { connect: tagIds.map((id) => ({ id })) },
        products: { connect: products },
      },
    });
    created++;
  }
  console.log(`✔ وبلاگ: ${posts.length} مقاله (${created} جدید)`);
}

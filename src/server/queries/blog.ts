import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const POSTS_PER_PAGE = 12;

const cardSelect = {
  slug: true,
  title: true,
  excerpt: true,
  readingMinutes: true,
  publishAt: true,
  category: { select: { name: true, slug: true } },
  cover: { select: { url: true, alt: true, width: true, height: true } },
} satisfies Prisma.PostSelect;

const live = (): Prisma.PostWhereInput => ({ status: "PUBLISHED", publishAt: { lte: new Date() } });

/** تاریخ‌ها از کش به رشته تبدیل می‌شوند؛ دوباره Date می‌کنیم */
function hydrate<T extends { publishAt: Date | string | null }>(p: T) {
  return { ...p, publishAt: p.publishAt ? new Date(p.publishAt) : null };
}

export const getPostList = unstable_cache(
  async (opts: { page: number; category?: string; tag?: string }) => {
    const where: Prisma.PostWhereInput = {
      ...live(),
      ...(opts.category ? { category: { slug: opts.category } } : {}),
      ...(opts.tag ? { tags: { some: { slug: opts.tag } } } : {}),
    };
    const [items, total] = await Promise.all([
      db.post.findMany({ where, orderBy: { publishAt: "desc" }, skip: (opts.page - 1) * POSTS_PER_PAGE, take: POSTS_PER_PAGE, select: cardSelect }),
      db.post.count({ where }),
    ]);
    return { items, total };
  },
  ["post-list"],
  { tags: ["posts"], revalidate: 600 },
);

export async function listPosts(opts: { page: number; category?: string; tag?: string }) {
  const r = await getPostList(opts);
  return { total: r.total, items: r.items.map(hydrate) };
}

export type PostCardData = Awaited<ReturnType<typeof listPosts>>["items"][number];

const getPostRaw = unstable_cache(
  async (slug: string) =>
    db.post.findFirst({
      where: { slug, ...live() },
      include: {
        category: true,
        tags: true,
        cover: true,
        author: { select: { name: true } },
        products: { where: { status: "PUBLISHED" }, select: { slug: true, name: true, industryName: true, shortDesc: true, icon: true, theme: true } },
      },
    }),
  ["post"],
  { tags: ["posts"], revalidate: 600 },
);

export async function getPost(slug: string) {
  const p = await getPostRaw(slug);
  if (!p) return null;
  return { ...hydrate(p), updatedAt: new Date(p.updatedAt), createdAt: new Date(p.createdAt) };
}

export const getRelatedPosts = unstable_cache(
  async (postId: string, categoryId: string | null, tagIds: string[]) => {
    const items = await db.post.findMany({
      where: { ...live(), id: { not: postId }, OR: [...(categoryId ? [{ categoryId }] : []), { tags: { some: { id: { in: tagIds } } } }] },
      orderBy: { publishAt: "desc" },
      take: 3,
      select: cardSelect,
    });
    return items;
  },
  ["related-posts"],
  { tags: ["posts"], revalidate: 600 },
);

export const getBlogTaxonomy = unstable_cache(
  async () => {
    const [categories, tags] = await Promise.all([
      db.postCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } } }),
      db.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } } }),
    ]);
    return { categories: categories.filter((c) => c._count.posts > 0), tags: tags.filter((t) => t._count.posts > 0) };
  },
  ["blog-taxonomy"],
  { tags: ["posts"], revalidate: 600 },
);

export { hydrate as hydratePost };

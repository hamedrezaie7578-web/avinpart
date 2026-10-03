import "server-only";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { db } from "@/lib/db";

export const getPage = unstable_cache(
  async (slug: string) => {
    const p = await db.page.findUnique({ where: { slug } });
    if (!p) return null;
    const html =
      typeof p.content === "object" && p.content && "html" in p.content
        ? String((p.content as { html: unknown }).html)
        : "";
    return { ...p, html };
  },
  ["page"],
  { tags: ["pages"], revalidate: 3600 },
);

export async function pageMetadata(slug: string, path: string): Promise<Metadata> {
  const p = await getPage(slug);
  if (!p) return {};
  return {
    title: { absolute: p.seoTitle ?? `${p.title} | AvinApps` },
    description: p.seoDescription ?? undefined,
    alternates: { canonical: path },
  };
}

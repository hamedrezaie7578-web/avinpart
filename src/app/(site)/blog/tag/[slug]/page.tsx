import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { BlogList } from "@/components/blog/blog-list";
import { getBlogTaxonomy, listPosts } from "@/server/queries/blog";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

async function load(slug: string) {
  const { tags } = await getBlogTaxonomy();
  return tags.find((t) => t.slug === decodeURIComponent(slug)) ?? null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const t = await load(slug);
  if (!t) return {};
  // صفحات برچسب محتوای تکراری دارند؛ ایندکس نمی‌شوند ولی لینک‌ها دنبال می‌شوند
  return { title: `برچسب ${t.name}`, robots: { index: false, follow: true }, alternates: { canonical: `/blog/tag/${t.slug}` } };
}

export default async function TagPage({ params, searchParams }: P) {
  const { slug } = await params;
  const t = await load(slug);
  if (!t) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { items, total } = await listPosts({ page, tag: t.slug });
  return (
    <>
      <PageHero crumbs={[{ name: "وبلاگ", href: "/blog" }, { name: `#${t.name}`, href: `/blog/tag/${t.slug}` }]} title={`مقالات با برچسب «${t.name}»`} />
      <BlogList items={items} total={total} page={page} basePath={`/blog/tag/${t.slug}`} activeTag={t.slug} />
    </>
  );
}

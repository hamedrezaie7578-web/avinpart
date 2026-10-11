import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { BlogList } from "@/components/blog/blog-list";
import { getBlogTaxonomy, listPosts } from "@/server/queries/blog";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

async function load(slug: string) {
  const { categories } = await getBlogTaxonomy();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const c = await load(slug);
  if (!c) return {};
  return { title: `مقالات ${c.name}`, description: c.description ?? `مجموعه مقالات آموزشی درباره‌ی ${c.name}`, alternates: { canonical: `/blog/category/${slug}` } };
}

export default async function CategoryPage({ params, searchParams }: P) {
  const { slug } = await params;
  const c = await load(slug);
  if (!c) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { items, total } = await listPosts({ page, category: slug });
  return (
    <>
      <PageHero crumbs={[{ name: "وبلاگ", href: "/blog" }, { name: c.name, href: `/blog/category/${slug}` }]} title={c.name} description={c.description ?? undefined} />
      <BlogList items={items} total={total} page={page} basePath={`/blog/category/${slug}`} activeCategory={slug} />
    </>
  );
}

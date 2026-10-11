import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { BlogList } from "@/components/blog/blog-list";
import { JsonLd } from "@/components/design-system/json-ld";
import { listPosts } from "@/server/queries/blog";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type SP = Promise<{ page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  return {
    title: page > 1 ? `وبلاگ — صفحه‌ی ${page}` : "وبلاگ؛ راهنمای حسابداری و مدیریت کسب‌وکار",
    description: "مقاله‌های کاربردی درباره‌ی حسابداری فروشگاهی، سامانه‌ی مودیان، مدیریت انبار، قیمت‌گذاری و رشد کسب‌وکارهای کوچک و متوسط.",
    alternates: { canonical: page > 1 ? `/blog?page=${page}` : "/blog" },
  };
}

export default async function BlogIndex({ searchParams }: { searchParams: SP }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { items, total } = await listPosts({ page });
  return (
    <>
      <PageHero crumbs={[{ name: "وبلاگ", href: "/blog" }]} title="وبلاگ آوین اپس" description="راهنماهای کاربردی برای مدیریت مالی، فروش و انبار کسب‌وکارتان؛ نوشته‌شده به زبان ساده برای صاحبان کسب‌وکار." />
      <BlogList items={items} total={total} page={page} basePath="/blog" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `وبلاگ ${SITE_NAME}`,
          url: absoluteUrl("/blog"),
          blogPost: items.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: absoluteUrl(`/blog/${p.slug}`), datePublished: p.publishAt?.toISOString() })),
        }}
      />
    </>
  );
}

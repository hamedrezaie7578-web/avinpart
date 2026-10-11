import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, ListTree, Send } from "lucide-react";
import { Breadcrumb } from "@/components/design-system/breadcrumb";
import { JsonLd } from "@/components/design-system/json-ld";
import { ProductCard } from "@/components/design-system/product-card";
import { CtaWithForm } from "@/components/sections/cta-with-form";
import { PostCard } from "@/components/blog/post-card";
import { Toc } from "@/components/blog/toc";
import { ViewBeacon } from "@/components/blog/view-beacon";
import { extractToc } from "@/lib/blog";
import { formatDate, toFaDigits } from "@/lib/format";
import { absoluteUrl, SITE_NAME, SITE_NAME_FA } from "@/lib/site";
import { getPost, getRelatedPosts, hydratePost } from "@/server/queries/blog";

export const revalidate = 600;

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    description,
    keywords: post.focusKeyword ? [post.focusKeyword, ...post.tags.map((t) => t.name)] : post.tags.map((t) => t.name),
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${slug}`,
      publishedTime: post.publishAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      section: post.category?.name,
      tags: post.tags.map((t) => t.name),
      ...(post.cover ? { images: [{ url: post.cover.url, alt: post.cover.alt ?? post.title }] } : {}),
    },
  };
}

export default async function PostPage({ params }: P) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const toc = extractToc(post.contentHtml);
  const related = (await getRelatedPosts(post.id, post.categoryId, post.tags.map((t) => t.id))).map(hydratePost);
  const url = absoluteUrl(`/blog/${slug}`);
  const crumbs = [{ name: "وبلاگ", href: "/blog" }, ...(post.category ? [{ name: post.category.name, href: `/blog/category/${post.category.slug}` }] : []), { name: post.title, href: `/blog/${slug}` }];
  const share = encodeURIComponent(`${post.title}\n${url}`);

  return (
    <>
      <ViewBeacon slug={slug} />
      <header className="bg-muted/30 border-b">
        <div className="container-x py-10 md:py-14">
          <Breadcrumb items={crumbs} />
          {post.category && <Link href={`/blog/category/${post.category.slug}`} className="bg-accent text-accent-foreground mt-6 inline-block rounded-full px-3 py-1 text-sm font-semibold">{post.category.name}</Link>}
          <h1 className="mt-4 max-w-4xl text-3xl leading-tight font-black text-balance md:text-[2.75rem] md:leading-tight">{post.title}</h1>
          <p className="text-muted-foreground mt-4 max-w-3xl text-lg leading-8">{post.excerpt}</p>
          <p className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span>نویسنده: <b className="text-foreground">{post.author.name ?? `تیم ${SITE_NAME_FA}`}</b></span>
            {post.publishAt && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden /><time dateTime={post.publishAt.toISOString()}>{formatDate(post.publishAt)}</time></span>}
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden />{toFaDigits(post.readingMinutes)} دقیقه مطالعه</span>
          </p>
        </div>
      </header>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {post.cover && (
            <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl border">
              <Image src={post.cover.url} alt={post.cover.alt ?? post.title} fill priority sizes="(min-width:1024px) 800px, 100vw" className="object-cover" />
            </div>
          )}
          {toc.length > 2 && (
            <details className="bg-card mb-8 rounded-2xl border p-4 lg:hidden">
              <summary className="flex cursor-pointer items-center gap-2 font-bold"><ListTree className="size-4" aria-hidden />فهرست مطالب</summary>
              <div className="mt-3"><Toc items={toc} /></div>
            </details>
          )}
          {/* HTML مقاله هنگام ذخیره در پنل پاک‌سازی (sanitize) شده است */}
          <article className="prose-fa max-w-3xl [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

          {post.tags.length > 0 && (
            <ul className="mt-10 flex max-w-3xl flex-wrap gap-2" aria-label="برچسب‌ها">
              {post.tags.map((t) => <li key={t.id}><Link href={`/blog/tag/${t.slug}`} className="hover:border-primary hover:text-primary inline-block rounded-full border px-3 py-1 text-sm">#{t.name}</Link></li>)}
            </ul>
          )}
          <div className="mt-6 flex max-w-3xl flex-wrap items-center gap-2 border-t pt-6 text-sm">
            <span className="font-bold">اشتراک‌گذاری:</span>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="hover:bg-accent inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5"><Send className="size-4" aria-hidden />تلگرام</a>
            <a href={`https://wa.me/?text=${share}`} target="_blank" rel="noopener noreferrer" className="hover:bg-accent rounded-lg border px-3 py-1.5">واتس‌اپ</a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="hover:bg-accent rounded-lg border px-3 py-1.5">لینکدین</a>
          </div>

          {post.products.length > 0 && (
            <section aria-labelledby="rel-products" className="mt-12">
              <h2 id="rel-products" className="mb-4 text-xl font-extrabold">نرم‌افزارهای مرتبط با این مقاله</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {post.products.map((p) => <li key={p.slug}><ProductCard product={p} /></li>)}
              </ul>
            </section>
          )}
        </div>

        {toc.length > 2 && (
          <aside className="hidden lg:block">
            <div className="bg-card sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border p-4">
              <p className="mb-3 flex items-center gap-2 font-extrabold"><ListTree className="size-4" aria-hidden />فهرست مطالب</p>
              <Toc items={toc} />
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="rel-posts" className="bg-muted/30 border-t">
          <div className="container-x py-12">
            <h2 id="rel-posts" className="mb-6 text-2xl font-extrabold">مقالات مرتبط</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => <li key={p.slug}><PostCard post={p} headingLevel={3} /></li>)}
            </ul>
          </div>
        </section>
      )}

      <CtaWithForm title="می‌خواهید این راهکارها را در کسب‌وکار خودتان ببینید؟" description="یک دموی رایگان رزرو کنید تا کارشناس ما نرم‌افزار مخصوص صنف شما را زنده نشان دهد." />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.seoDescription || post.excerpt,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          url,
          image: post.cover ? absoluteUrl(post.cover.url) : absoluteUrl(`/blog/${slug}/opengraph-image`),
          datePublished: post.publishAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          inLanguage: "fa-IR",
          articleSection: post.category?.name,
          keywords: post.tags.map((t) => t.name).join("، ") || undefined,
          author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
          publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") } },
        }}
      />
    </>
  );
}

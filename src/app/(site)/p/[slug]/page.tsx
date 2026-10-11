import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaticPage } from "@/components/sections/static-page";
import { pageMetadata } from "@/server/queries/pages";
import { SYSTEM_PAGES } from "@/lib/pages";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return pageMetadata(slug, `/p/${slug}`);
}

/** صفحات دلخواهی که مدیر از پنل می‌سازد */
export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug in SYSTEM_PAGES) notFound();
  return <StaticPage slug={slug} path={`/p/${slug}`} />;
}

import { OG_SIZE, renderOg } from "@/lib/og";
import { getPost } from "@/server/queries/blog";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "مقاله‌ی وبلاگ AvinApps";
export const revalidate = 86400;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return renderOg({ eyebrow: post?.category?.name ?? "وبلاگ", title: post?.title ?? "وبلاگ AvinApps", from: "#1e1b4b", to: "#4f46e5" });
}

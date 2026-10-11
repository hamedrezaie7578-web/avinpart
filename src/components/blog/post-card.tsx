import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { formatDate, toFaDigits } from "@/lib/format";

export type PostCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  readingMinutes: number;
  publishAt: Date | null;
  category: { name: string; slug: string } | null;
  cover: { url: string; alt: string | null; width: number | null; height: number | null } | null;
};

/** کارت مقاله؛ در نبود تصویر شاخص، یک پس‌زمینه‌ی گرافیکی ساده نمایش داده می‌شود */
export function PostCard({ post, headingLevel = 2 }: { post: PostCardProps; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as const;
  return (
    <article className="group bg-card relative flex h-full flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="bg-muted relative aspect-[16/9] overflow-hidden">
        {post.cover ? (
          <Image src={post.cover.url} alt={post.cover.alt ?? ""} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="bg-brand-gradient flex h-full items-center justify-center text-white/80" aria-hidden>
            <BookOpen className="size-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {post.category && <p className="text-primary text-sm font-bold">{post.category.name}</p>}
        <H className="mt-1.5 text-lg leading-8 font-extrabold">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 hover:text-primary">
            {post.title}
          </Link>
        </H>
        <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 leading-7">{post.excerpt}</p>
        <p className="text-muted-foreground mt-4 text-xs">
          {post.publishAt && <time dateTime={post.publishAt.toISOString()}>{formatDate(post.publishAt)}</time>} · {toFaDigits(post.readingMinutes)} دقیقه مطالعه
        </p>
      </div>
    </article>
  );
}

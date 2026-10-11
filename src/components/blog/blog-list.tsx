import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/design-system/empty-state";
import { getBlogTaxonomy, POSTS_PER_PAGE, type PostCardData } from "@/server/queries/blog";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PostCard } from "./post-card";

/** فهرست مقالات + صفحه‌بندی + دسته‌ها و برچسب‌ها */
export async function BlogList({ items, total, page, basePath, activeCategory, activeTag }: { items: PostCardData[]; total: number; page: number; basePath: string; activeCategory?: string; activeTag?: string }) {
  const { categories, tags } = await getBlogTaxonomy();
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        {items.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((p) => (
              <li key={p.slug}><PostCard post={p} /></li>
            ))}
          </ul>
        ) : (
          <EmptyState title="هنوز مقاله‌ای منتشر نشده است" description="به‌زودی راهنماهای کاربردی منتشر می‌کنیم." />
        )}
        {pages > 1 && (
          <nav aria-label="صفحه‌بندی" className="mt-10 flex items-center justify-center gap-1">
            {page > 1 && <Link href={href(page - 1)} rel="prev" className="hover:bg-accent inline-flex size-10 items-center justify-center rounded-lg border" aria-label="صفحه‌ی قبل"><ChevronRight className="size-4" /></Link>}
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={href(n)} aria-current={n === page ? "page" : undefined} className={cn("inline-flex size-10 items-center justify-center rounded-lg border text-sm", n === page ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>{toFaDigits(n)}</Link>
            ))}
            {page < pages && <Link href={href(page + 1)} rel="next" className="hover:bg-accent inline-flex size-10 items-center justify-center rounded-lg border" aria-label="صفحه‌ی بعد"><ChevronLeft className="size-4" /></Link>}
          </nav>
        )}
      </div>
      <aside className="space-y-6">
        <section aria-labelledby="cats" className="bg-card rounded-2xl border p-5">
          <h2 id="cats" className="mb-3 font-extrabold">دسته‌بندی‌ها</h2>
          <ul className="space-y-1">
            <li><Link href="/blog" className={cn("flex justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-accent", !activeCategory && !activeTag && "bg-accent font-bold")}>همه‌ی مقالات</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/blog/category/${c.slug}`} className={cn("flex justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-accent", activeCategory === c.slug && "bg-accent font-bold")}>
                  {c.name}<span className="text-muted-foreground">{toFaDigits(c._count.posts)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {tags.length > 0 && (
          <section aria-labelledby="tags" className="bg-card rounded-2xl border p-5">
            <h2 id="tags" className="mb-3 font-extrabold">برچسب‌ها</h2>
            <ul className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t.slug}><Link href={`/blog/tag/${t.slug}`} className={cn("inline-block rounded-full border px-3 py-1 text-xs hover:border-primary hover:text-primary", activeTag === t.slug && "border-primary text-primary")}>#{t.name}</Link></li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}

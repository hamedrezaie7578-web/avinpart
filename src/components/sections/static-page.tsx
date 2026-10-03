import { notFound } from "next/navigation";
import { PageHero } from "./page-hero";
import { getPage } from "@/server/queries/pages";
import { formatDate } from "@/lib/format";

/** رندر صفحه‌ی ثابت با محتوای HTML ذخیره‌شده در دیتابیس (قابل ویرایش از پنل) */
export async function StaticPage({
  slug,
  path,
  children,
}: {
  slug: string;
  path: string;
  children?: React.ReactNode;
}) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHero
        crumbs={[{ name: page.title, href: path }]}
        title={page.title}
        description={`آخرین به‌روزرسانی: ${formatDate(page.updatedAt)}`}
      />
      <div className="container-x py-12 md:py-16">
        {/* HTML فقط توسط مدیران از طریق ویرایشگر پنل تولید می‌شود */}
        <article
          className="prose-fa mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: page.html }}
        />
        {children}
      </div>
    </>
  );
}

import { AdminPage } from "@/components/admin/ui";
import { MediaGrid, MediaUploader } from "@/components/admin/media-grid";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "کتابخانه‌ی رسانه" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin("media.read");
  const { q } = await searchParams;
  const items = await db.media.findMany({
    where: { isPrivate: false, ...(q ? { alt: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 120,
  });
  return (
    <AdminPage title="کتابخانه‌ی رسانه" description="تصاویر عمومی سایت (اسکرین‌شات محصولات، تصاویر مقالات، نمونه‌کارها). فایل‌های نصب و پیوست‌های کاربران جداگانه و خصوصی نگهداری می‌شوند.">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <MediaUploader />
        <form className="flex items-end" method="get">
          <input name="q" defaultValue={q} placeholder="جست‌وجو در متن جایگزین…" className="h-11 w-full rounded-xl border bg-card px-3 text-sm" />
        </form>
      </div>
      <MediaGrid items={items} />
    </AdminPage>
  );
}

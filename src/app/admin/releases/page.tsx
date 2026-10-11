import { AdminPage, Card } from "@/components/admin/ui";
import { ActionButton, ActionForm, Check, DeleteButton, Field, Select, TextArea } from "@/components/admin/form";
import { PLATFORM_LABEL, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatNumber, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { createRelease, deleteRelease, toggleRelease } from "@/server/actions/admin/releases";

export const metadata = { title: "نسخه‌ها و دانلودها" };

export default async function ReleasesPage() {
  await requireAdmin("releases.read");
  const [releases, products] = await Promise.all([
    db.release.findMany({ include: { product: true, file: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <AdminPage title="نسخه‌ها و دانلودها" description="فایل‌های نصب خصوصی ذخیره می‌شوند و فقط دارندگان لایسنس (یا همه برای نسخه‌ی دمو) می‌توانند دانلود کنند. نسخه‌ی «اجباری» در پاسخ API لایسنس اعلام می‌شود.">
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card title="انتشار نسخه‌ی جدید" className="h-fit">
          <ActionForm action={createRelease} submitLabel="انتشار" resetOnSuccess>
            <Select label="محصول" name="productId" options={[{ value: "", label: "همه‌ی محصولات (هسته‌ی مشترک)" }, ...products.map((p) => ({ value: p.id, label: p.name }))]} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="پلتفرم" name="platform" options={Object.entries(PLATFORM_LABEL).map(([value, label]) => ({ value, label }))} />
              <Field label="نسخه" name="version" dir="ltr" placeholder="2.4.1" required />
            </div>
            <div>
              <label htmlFor="f-file" className="mb-1.5 block text-sm font-medium">فایل نصب (exe، msi، apk، zip)</label>
              <input id="f-file" name="file" type="file" accept=".exe,.msi,.zip,.apk,.aab" className="w-full text-sm" />
            </div>
            <TextArea label="تغییرات (Changelog)" name="changelog" rows={4} />
            <div className="grid gap-2">
              <Check label="منتشر شود" name="isPublished" defaultChecked />
              <Check label="به‌روزرسانی اجباری" name="isMandatory" />
              <Check label="نسخه‌ی دموی رایگان (قابل دانلود برای همه)" name="isDemo" />
            </div>
          </ActionForm>
        </Card>
        <Card title="نسخه‌های منتشرشده" className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b text-muted-foreground">
              <tr><th className="py-2 text-start font-medium">نسخه</th><th className="text-start font-medium">محصول</th><th className="text-start font-medium">فایل</th><th className="text-start font-medium">دانلود</th><th className="text-start font-medium">وضعیت</th><th /></tr>
            </thead>
            <tbody className="divide-y">
              {releases.map((r) => (
                <tr key={r.id}>
                  <td className="py-2"><span className="font-bold" dir="ltr">v{r.version}</span> <span className="text-muted-foreground">· {PLATFORM_LABEL[r.platform]} · {formatDate(r.createdAt)}</span></td>
                  <td>{r.product?.name ?? "همه"}</td>
                  <td className="text-xs text-muted-foreground" dir="ltr">{r.file ? `${r.file.alt} (${formatNumber(Math.round(r.file.size / 1024 / 1024))} MB)` : "—"}</td>
                  <td>{toFaDigits(r.downloads)}</td>
                  <td className="space-x-1 space-x-reverse">
                    {r.isPublished ? <StatusBadge tone="green">منتشرشده</StatusBadge> : <StatusBadge tone="gray">پیش‌نویس</StatusBadge>}
                    {r.isMandatory && <StatusBadge tone="amber">اجباری</StatusBadge>}
                    {r.isDemo && <StatusBadge tone="blue">دمو</StatusBadge>}
                  </td>
                  <td className="text-end whitespace-nowrap">
                    <ActionButton action={toggleRelease.bind(null, r.id, "isPublished")} variant="ghost">{r.isPublished ? "عدم انتشار" : "انتشار"}</ActionButton>
                    <ActionButton action={toggleRelease.bind(null, r.id, "isMandatory")} variant="ghost">{r.isMandatory ? "غیراجباری" : "اجباری"}</ActionButton>
                    <DeleteButton action={deleteRelease.bind(null, r.id)} label="" />
                  </td>
                </tr>
              ))}
              {!releases.length && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">هنوز نسخه‌ای منتشر نشده است.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminPage>
  );
}

import { notFound } from "next/navigation";
import { AdminPage, Card } from "@/components/admin/ui";
import { ActionForm, Check, DeleteButton, Field, Select, TextArea } from "@/components/admin/form";
import { ContentEditor } from "@/components/admin/page-editor";
import { MediaField } from "@/components/admin/list-save";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/admin/guard";
import { deletePortfolio, savePortfolio } from "@/server/actions/admin/content";

export const metadata = { title: "نمونه‌کار" };

export default async function PortfolioEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("content.write");
  const { id } = await params;
  const isNew = id === "new";
  const item = isNew ? null : await db.portfolioItem.findUnique({ where: { id }, include: { cover: true } });
  if (!isNew && !item) notFound();
  const html = item?.body && typeof item.body === "object" && "html" in item.body ? String((item.body as { html: unknown }).html) : "";
  return (
    <AdminPage title={isNew ? "نمونه‌کار جدید" : item!.title} back={{ href: "/admin/content?tab=portfolio", label: "نمونه‌کارها" }} actions={item && <DeleteButton action={deletePortfolio.bind(null, id)} redirectTo="/admin/content?tab=portfolio" />}>
      <Card className="max-w-4xl">
        <ActionForm action={savePortfolio.bind(null, isNew ? null : id)} redirectTo={isNew ? "/admin/content?tab=portfolio" : undefined}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان" name="title" required defaultValue={item?.title} />
            <Field label="نامک" name="slug" required dir="ltr" defaultValue={item?.slug} />
            <Field label="کارفرما" name="client" defaultValue={item?.client ?? ""} />
            <Select label="نوع" name="type" defaultValue={item?.type ?? "CUSTOM_SOFTWARE"} options={[{ value: "CUSTOM_SOFTWARE", label: "نرم‌افزار اختصاصی" }, { value: "WEBSITE", label: "وب‌سایت" }]} />
            <TextArea label="خلاصه" name="summary" required rows={3} defaultValue={item?.summary} className="sm:col-span-2" />
            <Field label="برچسب‌ها (با کاما)" name="tags" defaultValue={item?.tags.join("، ")} />
            <Field label="ترتیب" name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} />
            <MediaField name="coverId" label="تصویر کاور" initial={item?.cover ? { id: item.cover.id, url: item.cover.url } : null} />
            <div className="flex items-end"><Check name="isPublished" label="منتشرشده" defaultChecked={item?.isPublished ?? true} /></div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">شرح پروژه (اختیاری)</p>
            <ContentEditor name="html" initialHtml={html} />
          </div>
        </ActionForm>
      </Card>
    </AdminPage>
  );
}

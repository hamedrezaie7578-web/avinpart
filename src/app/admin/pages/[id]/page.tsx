import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminPage, Card, LinkButton } from "@/components/admin/ui";
import { ActionForm, DeleteButton, Field, TextArea } from "@/components/admin/form";
import { ContentEditor } from "@/components/admin/page-editor";
import { db } from "@/lib/db";
import { SYSTEM_PAGES, pagePath } from "@/lib/pages";
import { requireAdmin } from "@/server/admin/guard";
import { deletePage, savePage } from "@/server/actions/admin/pages";

export const metadata = { title: "ویرایش صفحه" };

export default async function PageEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("pages.write");
  const { id } = await params;
  const isNew = id === "new";
  const page = isNew ? null : await db.page.findUnique({ where: { id } });
  if (!isNew && !page) notFound();
  const system = !!page && page.slug in SYSTEM_PAGES;
  const html = page?.content && typeof page.content === "object" && "html" in page.content ? String((page.content as { html: unknown }).html) : "";
  return (
    <AdminPage
      title={isNew ? "صفحه‌ی جدید" : page!.title}
      back={{ href: "/admin/pages", label: "صفحات" }}
      actions={
        page && (
          <>
            <LinkButton href={pagePath(page.slug)} variant="outline"><ExternalLink className="size-4" aria-hidden />مشاهده</LinkButton>
            {!system && <DeleteButton action={deletePage.bind(null, id)} redirectTo="/admin/pages" />}
          </>
        )
      }
    >
      <ActionForm action={savePage.bind(null, isNew ? null : id)} redirectTo={isNew ? (d) => `/admin/pages/${(d as { id: string }).id}` : undefined}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <div className="grid gap-4">
              <Field label="عنوان" name="title" required defaultValue={page?.title} />
              {page?.slug === "home" ? (
                <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">محتوای صفحه‌ی اصلی از تب «متن‌های صفحه‌ی اصلی» مدیریت می‌شود؛ اینجا فقط سئوی آن را تنظیم کنید.</p>
              ) : (
                <ContentEditor name="html" initialHtml={html} minHeight={480} />
              )}
            </div>
          </Card>
          <div className="space-y-4">
            <Card title="آدرس">
              {system ? <p className="text-sm text-muted-foreground" dir="ltr">{pagePath(page!.slug)}</p> : <Field label="نامک" name="slug" required defaultValue={page?.slug} dir="ltr" hint="آدرس: /p/نامک" />}
            </Card>
            <Card title="سئو">
              <div className="grid gap-3">
                <Field label="عنوان سئو" name="seoTitle" defaultValue={page?.seoTitle ?? ""} maxLength={70} />
                <TextArea label="توضیحات متا" name="seoDescription" defaultValue={page?.seoDescription ?? ""} maxLength={170} rows={4} />
              </div>
            </Card>
          </div>
        </div>
      </ActionForm>
    </AdminPage>
  );
}

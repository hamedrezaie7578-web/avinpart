import { AdminPage, Card, Tabs } from "@/components/admin/ui";
import { ActionForm, DeleteButton, Field, Select, TextArea } from "@/components/admin/form";
import { db } from "@/lib/db";
import { toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { getSeoSettings } from "@/server/queries/settings";
import { deleteRedirect, saveRedirect, saveSeoSettings } from "@/server/actions/admin/settings";

export const metadata = { title: "سئو و ریدایرکت‌ها" };

export default async function SeoPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("seo.read");
  const sp = await searchParams;
  const tab = sp.tab === "redirects" ? "redirects" : "general";
  return (
    <AdminPage title="سئو و ریدایرکت‌ها">
      <Tabs base="/admin/seo" tabs={[{ key: "general", label: "تنظیمات سراسری" }, { key: "redirects", label: "ریدایرکت‌ها" }]} active={tab} />
      {tab === "general" ? <General /> : <Redirects />}
    </AdminPage>
  );
}

async function General() {
  const s = await getSeoSettings();
  return (
    <Card className="max-w-3xl">
      <ActionForm action={saveSeoSettings}>
        <Field label="عنوان پیش‌فرض سایت" name="defaultTitle" defaultValue={s.defaultTitle} maxLength={90} />
        <TextArea label="توضیحات متای پیش‌فرض" name="defaultDescription" defaultValue={s.defaultDescription} rows={3} maxLength={200} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="کد تأیید Google Search Console" name="googleSiteVerification" dir="ltr" defaultValue={s.googleSiteVerification} hint="فقط مقدار content متاتگ" />
          <Field label="شناسه‌ی Google Analytics 4" name="googleAnalyticsId" dir="ltr" defaultValue={s.googleAnalyticsId} placeholder="G-XXXXXXXXXX" />
        </div>
        <TextArea label="قوانین اضافه‌ی robots.txt" name="robotsExtra" dir="ltr" rows={4} defaultValue={s.robotsExtra} hint="مثلاً: Disallow: /search — هر قانون در یک خط" />
        <p className="text-sm text-muted-foreground">نقشه‌ی سایت (sitemap.xml)، robots.txt، داده‌های ساختاریافته (JSON-LD) و تصاویر OG به‌صورت خودکار تولید می‌شوند. سئوی هر محصول، صفحه و مقاله در ویرایشگر خودش تنظیم می‌شود.</p>
      </ActionForm>
    </Card>
  );
}

async function Redirects() {
  const items = await db.redirect.findMany({ orderBy: { from: "asc" } });
  const codeOpts = [{ value: "301", label: "۳۰۱ (دائمی)" }, { value: "302", label: "۳۰۲ (موقت)" }];
  return (
    <div className="space-y-4">
      <Card title="ریدایرکت جدید">
        <ActionForm action={saveRedirect.bind(null, null)} resetOnSuccess submitLabel="افزودن">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px]">
            <Field label="از (مسیر قدیمی)" name="from" required dir="ltr" placeholder="/old-page" />
            <Field label="به (مسیر یا آدرس جدید)" name="to" required dir="ltr" placeholder="/avingold" />
            <Select label="نوع" name="code" options={codeOpts} />
          </div>
        </ActionForm>
      </Card>
      {items.map((r) => (
        <Card key={r.id} title={<span dir="ltr" className="font-mono text-sm">{r.from} → {r.to}</span>} actions={<><span className="text-xs text-muted-foreground">{toFaDigits(r.hits)} بازدید</span><DeleteButton action={deleteRedirect.bind(null, r.id)} /></>}>
          <ActionForm action={saveRedirect.bind(null, r.id)}>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px]">
              <Field label="از" name="from" required dir="ltr" defaultValue={r.from} />
              <Field label="به" name="to" required dir="ltr" defaultValue={r.to} />
              <Select label="نوع" name="code" options={codeOpts} defaultValue={String(r.code)} />
            </div>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}

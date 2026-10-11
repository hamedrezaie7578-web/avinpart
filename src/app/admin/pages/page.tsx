import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPage, Card, LinkButton, Tabs } from "@/components/admin/ui";
import { ActionForm, Field, TextArea } from "@/components/admin/form";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { HOME_TEXT_FIELDS, resolveHomeTexts } from "@/lib/home-texts";
import { SYSTEM_PAGES, pagePath } from "@/lib/pages";
import { requireAdmin } from "@/server/admin/guard";
import { saveHomeTexts } from "@/server/actions/admin/pages";

export const metadata = { title: "صفحات" };

const TABS = [
  { key: "pages", label: "صفحات" },
  { key: "home", label: "متن‌های صفحه‌ی اصلی" },
];

export default async function PagesAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("pages.read");
  const sp = await searchParams;
  const tab = sp.tab === "home" ? "home" : "pages";
  return (
    <AdminPage title="صفحات و صفحه‌ی اصلی" actions={tab === "pages" && <LinkButton href="/admin/pages/new"><Plus className="size-4" aria-hidden />صفحه‌ی جدید</LinkButton>}>
      <Tabs base="/admin/pages" tabs={TABS} active={tab} />
      {tab === "pages" ? <PagesList /> : <HomeTexts />}
    </AdminPage>
  );
}

async function PagesList() {
  const pages = await db.page.findMany({ orderBy: { title: "asc" } });
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 text-start font-medium">عنوان</th>
            <th scope="col" className="px-4 py-3 text-start font-medium">آدرس</th>
            <th scope="col" className="px-4 py-3 text-start font-medium">نوع</th>
            <th scope="col" className="px-4 py-3 text-start font-medium">به‌روزرسانی</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {pages.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-bold"><Link href={`/admin/pages/${p.id}`} className="hover:text-primary">{p.title}</Link></td>
              <td className="px-4 py-3 text-muted-foreground" dir="ltr">{pagePath(p.slug)}</td>
              <td className="px-4 py-3">{p.slug in SYSTEM_PAGES ? <StatusBadge tone="blue">سیستمی</StatusBadge> : <StatusBadge tone="gray">سفارشی</StatusBadge>}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(p.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function HomeTexts() {
  const row = await db.setting.findUnique({ where: { key: "home.texts" } });
  const t = resolveHomeTexts(row?.value);
  return (
    <Card className="max-w-4xl">
      <p className="mb-4 text-sm text-muted-foreground">چیدمان صفحه‌ی اصلی ثابت است و متن‌ها از اینجا تغییر می‌کنند. کارت محصولات، نظرات، سؤالات و مقالات از ماژول‌های خودشان خوانده می‌شوند.</p>
      <ActionForm action={saveHomeTexts}>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOME_TEXT_FIELDS.map(([k, label, d]) =>
            d.length > 90 ? <TextArea key={k} name={k} label={label} defaultValue={t[k]} rows={3} className="sm:col-span-2" /> : <Field key={k} name={k} label={label} defaultValue={t[k]} />,
          )}
        </div>
      </ActionForm>
    </Card>
  );
}

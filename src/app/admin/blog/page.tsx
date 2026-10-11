import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { AdminPage, Card, LinkButton, Tabs } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ActionForm, DeleteButton, Field } from "@/components/admin/form";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatNumber, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { orderBy, paging, parseList } from "@/server/admin/list";
import { deletePostCategory, deleteTag, savePostCategory, saveTag } from "@/server/actions/admin/blog";

export const metadata = { title: "وبلاگ" };

const TABS = [
  { key: "posts", label: "مقالات" },
  { key: "categories", label: "دسته‌ها" },
  { key: "tags", label: "برچسب‌ها" },
];

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("blog.read");
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as string) : "posts";
  return (
    <AdminPage title="وبلاگ" actions={tab === "posts" && <LinkButton href="/admin/blog/new"><Plus className="size-4" aria-hidden />مقاله‌ی جدید</LinkButton>}>
      <Tabs base="/admin/blog" tabs={TABS} active={tab} />
      {tab === "posts" && <Posts sp={sp} />}
      {tab === "categories" && <Categories />}
      {tab === "tags" && <TagsTab />}
    </AdminPage>
  );
}

async function Posts({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const p = parseList(sp);
  const now = new Date();
  const where: Prisma.PostWhereInput = {
    ...(p.f.status === "SCHEDULED" ? { status: "PUBLISHED", publishAt: { gt: now } } : p.f.status ? { status: p.f.status as "DRAFT" } : {}),
    ...(p.f.category ? { categoryId: p.f.category } : {}),
    ...(p.q ? { title: { contains: p.q, mode: "insensitive" } } : {}),
  };
  const [rows, total, cats] = await Promise.all([
    db.post.findMany({ where, orderBy: p.sort ? orderBy(p, ["publishAt", "views", "seoScore", "updatedAt"], "updatedAt") : { updatedAt: "desc" }, ...paging(p), include: { category: true, author: { select: { name: true } } } }),
    db.post.count({ where }),
    db.postCategory.findMany(),
  ]);
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { key: "t", header: "عنوان", cell: (r) => <span className="font-bold">{r.title}</span> },
    { key: "c", header: "دسته", cell: (r) => r.category?.name ?? "—" },
    {
      key: "s",
      header: "وضعیت",
      cell: (r) =>
        r.status === "PUBLISHED" ? (r.publishAt && r.publishAt > now ? <StatusBadge tone="amber">زمان‌بندی: {formatDate(r.publishAt)}</StatusBadge> : <StatusBadge tone="green">منتشرشده</StatusBadge>) : r.status === "DRAFT" ? <StatusBadge tone="gray">پیش‌نویس</StatusBadge> : <StatusBadge tone="gray">بایگانی</StatusBadge>,
    },
    { key: "seo", header: "سئو", sortKey: "seoScore", cell: (r) => <StatusBadge tone={(r.seoScore ?? 0) >= 80 ? "green" : (r.seoScore ?? 0) >= 50 ? "amber" : "red"}>{toFaDigits(r.seoScore ?? 0)}</StatusBadge> },
    { key: "v", header: "بازدید", sortKey: "views", cell: (r) => formatNumber(r.views) },
    { key: "d", header: "انتشار", sortKey: "publishAt", cell: (r) => <span className="text-muted-foreground">{r.publishAt ? formatDate(r.publishAt) : "—"}</span> },
    { key: "a", header: "نویسنده", cell: (r) => r.author.name ?? "—" },
  ];
  return (
    <DataTable
      basePath="/admin/blog"
      searchParams={sp}
      rows={rows}
      total={total}
      page={p.page}
      pageSize={p.pageSize}
      columns={columns}
      rowHref={(r) => `/admin/blog/${r.id}`}
      searchPlaceholder="عنوان مقاله"
      filters={[
        { key: "status", label: "وضعیت", options: [{ value: "PUBLISHED", label: "منتشرشده" }, { value: "SCHEDULED", label: "زمان‌بندی‌شده" }, { value: "DRAFT", label: "پیش‌نویس" }, { value: "ARCHIVED", label: "بایگانی" }] },
        { key: "category", label: "دسته", options: cats.map((c) => ({ value: c.id, label: c.name })) },
      ]}
    />
  );
}

async function Categories() {
  const cats = await db.postCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="دسته‌ی جدید">
        <ActionForm action={savePostCategory.bind(null, null)} resetOnSuccess submitLabel="افزودن">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="نام" name="name" required /><Field label="نامک" name="slug" required dir="ltr" /></div>
          <Field label="توضیح (متای صفحه‌ی دسته)" name="description" />
        </ActionForm>
      </Card>
      {cats.map((c) => (
        <Card key={c.id} title={`${c.name} (${toFaDigits(c._count.posts)} مقاله)`} actions={<DeleteButton action={deletePostCategory.bind(null, c.id)} />}>
          <ActionForm action={savePostCategory.bind(null, c.id)}>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="نام" name="name" required defaultValue={c.name} /><Field label="نامک" name="slug" required dir="ltr" defaultValue={c.slug} /></div>
            <Field label="توضیح" name="description" defaultValue={c.description ?? ""} />
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}

async function TagsTab() {
  const tags = await db.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } });
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tags.map((t) => (
        <Card key={t.id} title={`${t.name} (${toFaDigits(t._count.posts)})`} actions={<DeleteButton action={deleteTag.bind(null, t.id)} label="" />}>
          <ActionForm action={saveTag.bind(null, t.id)}>
            <div className="grid grid-cols-2 gap-2"><Field label="نام" name="name" required defaultValue={t.name} /><Field label="نامک" name="slug" required dir="ltr" defaultValue={t.slug} /></div>
          </ActionForm>
        </Card>
      ))}
      {!tags.length && <p className="text-sm text-muted-foreground">برچسب‌ها هنگام ذخیره‌ی مقاله خودکار ساخته می‌شوند.</p>}
    </div>
  );
}

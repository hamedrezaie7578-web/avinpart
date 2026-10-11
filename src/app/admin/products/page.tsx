import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { AdminPage, LinkButton } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/dashboard/ui";
import { Icon } from "@/components/design-system/icon";
import { db } from "@/lib/db";
import { themeSchema } from "@/lib/theme";
import { formatDate, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { orderBy, paging, parseList } from "@/server/admin/list";

export const metadata = { title: "محصولات" };

const STATUS = { PUBLISHED: ["green", "منتشرشده"], DRAFT: ["amber", "پیش‌نویس"], ARCHIVED: ["gray", "بایگانی"] } as const;

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("products.read");
  const sp = await searchParams;
  const p = parseList(sp, { pageSize: 50 });
  const where: Prisma.ProductWhereInput = {
    ...(p.q ? { OR: [{ name: { contains: p.q, mode: "insensitive" } }, { industryName: { contains: p.q } }, { slug: { contains: p.q.toLowerCase() } }] } : {}),
    ...(p.f.status ? { status: p.f.status as "DRAFT" } : {}),
    ...(p.f.category ? { categoryId: p.f.category } : {}),
  };
  const [rows, total, cats] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: p.sort ? orderBy(p, ["name", "sortOrder", "updatedAt"], "sortOrder") : { sortOrder: "asc" },
      ...paging(p),
      include: { category: true, _count: { select: { licenses: true, sections: true } } },
    }),
    db.product.count({ where }),
    db.industryCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "محصول",
      sortKey: "name",
      cell: (r) => {
        const t = themeSchema.safeParse(r.theme);
        return (
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl text-white" style={{ background: t.success ? t.data.primary : "#4f46e5" }}>
              <Icon name={r.icon} className="size-4" />
            </span>
            <span>
              <span className="block font-bold">{r.name}</span>
              <span className="text-xs text-muted-foreground" dir="ltr">/{r.slug}</span>
            </span>
          </span>
        );
      },
    },
    { key: "industry", header: "صنف", cell: (r) => r.industryName },
    { key: "cat", header: "دسته", cell: (r) => r.category?.name ?? "—" },
    { key: "status", header: "وضعیت", cell: (r) => <StatusBadge tone={STATUS[r.status][0]}>{STATUS[r.status][1]}</StatusBadge> },
    { key: "feat", header: "ویژه", cell: (r) => (r.isFeatured ? "★" : "") },
    { key: "sections", header: "سکشن", cell: (r) => toFaDigits(r._count.sections) },
    { key: "lic", header: "لایسنس", cell: (r) => toFaDigits(r._count.licenses) },
    { key: "sort", header: "ترتیب", sortKey: "sortOrder", cell: (r) => toFaDigits(r.sortOrder) },
    { key: "upd", header: "به‌روزرسانی", sortKey: "updatedAt", cell: (r) => <span className="text-muted-foreground">{formatDate(r.updatedAt)}</span> },
  ];
  return (
    <AdminPage title="محصولات" description="هر محصول یک لندینگ اختصاصی با پالت رنگ و سکشن‌های قابل مدیریت دارد." actions={<LinkButton href="/admin/products/new"><Plus className="size-4" aria-hidden />محصول جدید</LinkButton>}>
      <DataTable
        basePath="/admin/products"
        searchParams={sp}
        rows={rows}
        total={total}
        page={p.page}
        pageSize={p.pageSize}
        columns={columns}
        rowHref={(r) => `/admin/products/${r.id}`}
        searchPlaceholder="نام، صنف یا نامک"
        filters={[
          { key: "status", label: "وضعیت", options: Object.entries(STATUS).map(([value, [, label]]) => ({ value, label })) },
          { key: "category", label: "دسته", options: cats.map((c) => ({ value: c.id, label: c.name })) },
        ]}
        exportHref="/api/admin/export/products"
      />
    </AdminPage>
  );
}

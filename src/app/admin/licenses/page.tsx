import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { AdminPage, LinkButton } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { LICENSE_STATUS, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, normalizeMobile, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { orderBy, paging, parseList } from "@/server/admin/list";

export const metadata = { title: "لایسنس‌ها" };

export default async function LicensesAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("licenses.read");
  const sp = await searchParams;
  const p = parseList(sp, { sort: "createdAt" });
  const where: Prisma.LicenseWhereInput = {
    ...(p.f.status ? { status: p.f.status as never } : {}),
    ...(p.f.product ? { productId: p.f.product } : {}),
    ...(p.f.plan ? { planId: p.f.plan } : {}),
    ...(p.q ? { OR: [{ key: { contains: p.q.toUpperCase() } }, { user: { mobile: { contains: normalizeMobile(p.q) ?? p.q } } }] } : {}),
  };
  const [rows, total, products, plans] = await Promise.all([
    db.license.findMany({ where, include: { product: true, plan: true, user: true, _count: { select: { devices: { where: { isActive: true } } } } }, orderBy: orderBy(p, ["createdAt", "expiresAt"], "createdAt"), ...paging(p) }),
    db.license.count({ where }),
    db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.plan.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { key: "key", header: "کلید", cell: (l) => <span className="font-mono text-xs font-bold" dir="ltr">{l.key}</span> },
    { key: "product", header: "محصول / پلن", cell: (l) => <span>{l.product.name} <span className="text-muted-foreground">· {l.plan.name}</span></span> },
    { key: "user", header: "مشتری", cell: (l) => l.user.name || toFaDigits(l.user.mobile) },
    { key: "devices", header: "دستگاه", cell: (l) => `${toFaDigits(l._count.devices)}/${toFaDigits(l.maxDevices)}` },
    { key: "status", header: "وضعیت", cell: (l) => <StatusBadge tone={LICENSE_STATUS[l.status].tone}>{LICENSE_STATUS[l.status].label}</StatusBadge> },
    { key: "expiresAt", header: "انقضا", sortKey: "expiresAt", cell: (l) => (l.expiresAt ? formatDate(l.expiresAt) : "دائمی") },
    { key: "createdAt", header: "صدور", sortKey: "createdAt", cell: (l) => <span className="text-muted-foreground">{formatDate(l.createdAt)}</span> },
  ];
  return (
    <AdminPage title="لایسنس‌ها" actions={<LinkButton href="/admin/licenses/new"><Plus className="size-4" aria-hidden />صدور لایسنس دستی</LinkButton>}>
      <DataTable
        basePath="/admin/licenses"
        searchParams={sp}
        rows={rows}
        total={total}
        page={p.page}
        pageSize={p.pageSize}
        columns={columns}
        rowHref={(l) => `/admin/licenses/${l.id}`}
        searchPlaceholder="کلید لایسنس یا موبایل مشتری"
        exportHref="/api/admin/export/licenses"
        filters={[
          { key: "status", label: "وضعیت", options: Object.entries(LICENSE_STATUS).map(([value, v]) => ({ value, label: v.label })) },
          { key: "product", label: "محصول", options: products.map((x) => ({ value: x.id, label: x.name })) },
          { key: "plan", label: "پلن", options: plans.map((x) => ({ value: x.id, label: x.name })) },
        ]}
      />
    </AdminPage>
  );
}

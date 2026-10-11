import type { Prisma } from "@prisma/client";
import { AdminPage } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, normalizeMobile, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { orderBy, paging, parseList } from "@/server/admin/list";

export const metadata = { title: "مشتریان" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("customers.read");
  const sp = await searchParams;
  const p = parseList(sp, { sort: "createdAt" });
  const where: Prisma.UserWhereInput = {
    type: "CUSTOMER",
    ...(p.f.blocked ? { isBlocked: p.f.blocked === "1" } : {}),
    ...(p.q ? { OR: [{ mobile: { contains: normalizeMobile(p.q) ?? p.q } }, { name: { contains: p.q, mode: "insensitive" } }, { businessName: { contains: p.q, mode: "insensitive" } }, { email: { contains: p.q.toLowerCase() } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.user.findMany({ where, include: { _count: { select: { orders: { where: { status: "PAID" } }, licenses: true } } }, orderBy: orderBy(p, ["createdAt", "lastLoginAt"], "createdAt"), ...paging(p) }),
    db.user.count({ where }),
  ]);
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { key: "name", header: "نام", cell: (u) => <span className="font-medium">{u.name || "—"}</span> },
    { key: "mobile", header: "موبایل", cell: (u) => <span dir="ltr">{toFaDigits(u.mobile)}</span> },
    { key: "business", header: "کسب‌وکار", cell: (u) => u.businessName ?? "—" },
    { key: "orders", header: "خرید موفق", cell: (u) => toFaDigits(u._count.orders) },
    { key: "licenses", header: "لایسنس", cell: (u) => toFaDigits(u._count.licenses) },
    { key: "status", header: "وضعیت", cell: (u) => (u.isBlocked ? <StatusBadge tone="red">مسدود</StatusBadge> : <StatusBadge tone="green">فعال</StatusBadge>) },
    { key: "createdAt", header: "عضویت", sortKey: "createdAt", cell: (u) => <span className="text-muted-foreground">{formatDate(u.createdAt)}</span> },
  ];
  return (
    <AdminPage title="مشتریان">
      <DataTable
        basePath="/admin/customers"
        searchParams={sp}
        rows={rows}
        total={total}
        page={p.page}
        pageSize={p.pageSize}
        columns={columns}
        rowHref={(u) => `/admin/customers/${u.id}`}
        searchPlaceholder="نام، موبایل، کسب‌وکار یا ایمیل"
        exportHref="/api/admin/export/customers"
        filters={[{ key: "blocked", label: "وضعیت", options: [{ value: "0", label: "فعال" }, { value: "1", label: "مسدود" }] }]}
      />
    </AdminPage>
  );
}

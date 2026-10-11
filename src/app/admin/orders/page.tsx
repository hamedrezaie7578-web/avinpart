import type { Prisma } from "@prisma/client";
import { AdminPage } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ORDER_STATUS, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime, formatNumber, normalizeMobile, toEnDigits, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { orderBy, paging, parseList } from "@/server/admin/list";

export const metadata = { title: "سفارش‌ها" };

const KIND = { PURCHASE: "خرید", UPGRADE: "ارتقا", RENEWAL: "تمدید" } as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("orders.read");
  const sp = await searchParams;
  const p = parseList(sp, { sort: "createdAt" });
  const q = toEnDigits(p.q);
  const where: Prisma.OrderWhereInput = {
    ...(p.f.status ? { status: p.f.status as never } : {}),
    ...(p.f.kind ? { kind: p.f.kind as never } : {}),
    ...(q
      ? { OR: [...(/^\d+$/.test(q) && Number(q) < 2e9 ? [{ number: Number(q) }] : []), { user: { mobile: { contains: normalizeMobile(q) ?? q } } }, { user: { name: { contains: q, mode: "insensitive" as const } } }] }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.order.findMany({ where, include: { user: true, items: true }, orderBy: orderBy(p, ["createdAt", "total", "number"], "createdAt"), ...paging(p) }),
    db.order.count({ where }),
  ]);
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { key: "number", header: "شماره", sortKey: "number", cell: (o) => <span className="font-bold">#{toFaDigits(o.number)}</span> },
    { key: "user", header: "مشتری", cell: (o) => <span>{o.user.name || toFaDigits(o.user.mobile)}</span> },
    { key: "items", header: "اقلام", cell: (o) => <span className="line-clamp-1 max-w-72 text-muted-foreground">{KIND[o.kind]} · {o.items.map((i) => i.title).join("، ")}</span> },
    { key: "total", header: "مبلغ (تومان)", sortKey: "total", cell: (o) => formatNumber(o.total) },
    { key: "status", header: "وضعیت", cell: (o) => <StatusBadge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</StatusBadge> },
    { key: "createdAt", header: "تاریخ", sortKey: "createdAt", cell: (o) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(o.createdAt)}</span> },
  ];
  return (
    <AdminPage title="سفارش‌ها و پرداخت‌ها">
      <DataTable
        basePath="/admin/orders"
        searchParams={sp}
        rows={rows}
        total={total}
        page={p.page}
        pageSize={p.pageSize}
        columns={columns}
        rowHref={(o) => `/admin/orders/${o.id}`}
        searchPlaceholder="شماره سفارش، موبایل یا نام مشتری"
        exportHref="/api/admin/export/orders"
        filters={[
          { key: "status", label: "وضعیت", options: Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.label })) },
          { key: "kind", label: "نوع", options: Object.entries(KIND).map(([value, label]) => ({ value, label })) },
        ]}
      />
    </AdminPage>
  );
}

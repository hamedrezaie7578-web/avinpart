import { Plus } from "lucide-react";
import { AdminPage, LinkButton } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatNumber, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { paging, parseList } from "@/server/admin/list";

export const metadata = { title: "کدهای تخفیف" };

export default async function CouponsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("coupons.read");
  const sp = await searchParams;
  const p = parseList(sp);
  const where = p.q ? { code: { contains: p.q.toUpperCase() } } : {};
  const [rows, total] = await Promise.all([db.coupon.findMany({ where, orderBy: { code: "asc" }, ...paging(p) }), db.coupon.count({ where })]);
  const now = new Date();
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { key: "code", header: "کد", cell: (c) => <span className="font-mono font-bold" dir="ltr">{c.code}</span> },
    { key: "value", header: "تخفیف", cell: (c) => (c.type === "PERCENT" ? `${toFaDigits(c.value)}٪` : `${formatNumber(c.value)} تومان`) },
    { key: "used", header: "استفاده", cell: (c) => `${toFaDigits(c.usedCount)}${c.maxUses ? ` از ${toFaDigits(c.maxUses)}` : ""}` },
    { key: "range", header: "بازه", cell: (c) => <span className="text-muted-foreground">{c.startsAt ? formatDate(c.startsAt) : "—"} تا {c.endsAt ? formatDate(c.endsAt) : "—"}</span> },
    {
      key: "status",
      header: "وضعیت",
      cell: (c) => (!c.isActive ? <StatusBadge tone="gray">غیرفعال</StatusBadge> : c.endsAt && c.endsAt < now ? <StatusBadge tone="red">منقضی</StatusBadge> : <StatusBadge tone="green">فعال</StatusBadge>),
    },
  ];
  return (
    <AdminPage title="کدهای تخفیف" actions={<LinkButton href="/admin/coupons/new"><Plus className="size-4" aria-hidden />کد جدید</LinkButton>}>
      <DataTable basePath="/admin/coupons" searchParams={sp} rows={rows} total={total} page={p.page} pageSize={p.pageSize} columns={columns} rowHref={(c) => `/admin/coupons/${c.id}`} searchPlaceholder="جست‌وجوی کد" />
    </AdminPage>
  );
}

import type { Prisma } from "@prisma/client";
import { AdminPage } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ActionButton, DeleteButton } from "@/components/admin/form";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { paging, parseList } from "@/server/admin/list";
import { deleteLead, toggleLeadHandled } from "@/server/actions/admin/ops";

export const metadata = { title: "فرم‌ها و درخواست‌ها" };

const TYPES = { DEMO: ["blue", "درخواست دمو"], CONTACT: ["gray", "تماس"], CONSULT: ["amber", "مشاوره"], NEWSLETTER: ["green", "خبرنامه"] } as const;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("forms.read");
  const sp = await searchParams;
  const p = parseList(sp);
  const where: Prisma.LeadWhereInput = {
    ...(p.f.type ? { type: p.f.type as "DEMO" } : {}),
    ...(p.f.handled ? { isHandled: p.f.handled === "yes" } : {}),
    ...(p.q ? { OR: [{ name: { contains: p.q, mode: "insensitive" } }, { mobile: { contains: p.q } }, { message: { contains: p.q, mode: "insensitive" } }] } : {}),
  };
  const [rows, total, products] = await Promise.all([
    db.lead.findMany({ where, orderBy: { createdAt: "desc" }, ...paging(p) }),
    db.lead.count({ where }),
    db.product.findMany({ select: { id: true, name: true } }),
  ]);
  const pname = new Map(products.map((x) => [x.id, x.name]));
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { key: "t", header: "نوع", cell: (l) => <StatusBadge tone={TYPES[l.type][0]}>{TYPES[l.type][1]}</StatusBadge> },
    { key: "n", header: "نام و تماس", cell: (l) => <span><b>{l.name ?? "—"}</b><br /><a href={`tel:${l.mobile}`} dir="ltr" className="text-xs text-muted-foreground">{l.mobile ?? l.email}</a></span> },
    { key: "p", header: "محصول", cell: (l) => (l.productId ? pname.get(l.productId) ?? "—" : "—") },
    { key: "m", header: "پیام", className: "max-w-sm", cell: (l) => <span className="line-clamp-2 text-muted-foreground">{l.message ?? "—"}</span> },
    { key: "s", header: "منبع", cell: (l) => <span className="block max-w-40 truncate text-xs text-muted-foreground" dir="ltr" title={l.source ?? ""}>{l.source ?? "—"}</span> },
    { key: "d", header: "تاریخ", cell: (l) => <span className="text-muted-foreground">{formatDateTime(l.createdAt)}</span> },
    {
      key: "a",
      header: "عملیات",
      cell: (l) => (
        <span className="flex gap-1">
          <ActionButton action={toggleLeadHandled.bind(null, l.id)} variant={l.isHandled ? "ghost" : "default"}>{l.isHandled ? "رسیدگی‌شده ✓" : "رسیدگی شد"}</ActionButton>
          <DeleteButton action={deleteLead.bind(null, l.id)} label="" />
        </span>
      ),
    },
  ];
  return (
    <AdminPage title="فرم‌ها و درخواست‌ها" description="درخواست‌های دمو، تماس، مشاوره و عضویت خبرنامه از فرم‌های سایت.">
      <DataTable
        basePath="/admin/forms"
        searchParams={sp}
        rows={rows}
        total={total}
        page={p.page}
        pageSize={p.pageSize}
        columns={columns}
        searchPlaceholder="نام، موبایل یا متن پیام"
        exportHref="/api/admin/export/leads"
        filters={[
          { key: "type", label: "نوع", options: Object.entries(TYPES).map(([value, [, label]]) => ({ value, label })) },
          { key: "handled", label: "رسیدگی", options: [{ value: "no", label: "رسیدگی‌نشده" }, { value: "yes", label: "رسیدگی‌شده" }] },
        ]}
      />
    </AdminPage>
  );
}

import type { Prisma } from "@prisma/client";
import { AdminPage, Card, Tabs } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ActionForm, DeleteButton, Field, TextArea } from "@/components/admin/form";
import { StatusBadge, TICKET_PRIORITY as PRIORITY, TICKET_STATUS } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { paging, parseList } from "@/server/admin/list";
import { deleteCannedReply, saveCannedReply } from "@/server/actions/admin/tickets";

export const metadata = { title: "تیکت‌ها" };


export default async function TicketsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("tickets.read");
  const sp = await searchParams;
  const tab = sp.tab === "canned" ? "canned" : "list";
  return (
    <AdminPage title="تیکت‌ها">
      <Tabs base="/admin/tickets" tabs={[{ key: "list", label: "تیکت‌ها" }, { key: "canned", label: "پاسخ‌های آماده" }]} active={tab} />
      {tab === "list" ? <List sp={sp} /> : <Canned />}
    </AdminPage>
  );
}

async function List({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const p = parseList(sp);
  const status = p.f.status ?? (sp.f_status === undefined ? "active" : "");
  const where: Prisma.TicketWhereInput = {
    ...(status === "active" ? { status: { in: ["OPEN", "CUSTOMER_REPLY"] } } : status ? { status: status as "OPEN" } : {}),
    ...(p.f.priority ? { priority: p.f.priority as "LOW" } : {}),
    ...(p.f.department ? { departmentId: p.f.department } : {}),
    ...(p.q ? { OR: [{ subject: { contains: p.q, mode: "insensitive" } }, { user: { mobile: { contains: p.q } } }, ...(/^\d+$/.test(p.q) ? [{ number: Number(p.q) }] : [])] } : {}),
  };
  const [rows, total, deps] = await Promise.all([
    db.ticket.findMany({ where, orderBy: [{ updatedAt: "desc" }], ...paging(p), include: { user: { select: { name: true, mobile: true } }, department: true } }),
    db.ticket.count({ where }),
    db.department.findMany(),
  ]);
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { key: "n", header: "شماره", cell: (t) => <span className="font-mono">#{toFaDigits(t.number)}</span> },
    { key: "s", header: "موضوع", cell: (t) => <span className="font-bold">{t.subject}</span> },
    { key: "u", header: "مشتری", cell: (t) => t.user.name ?? <span dir="ltr">{t.user.mobile}</span> },
    { key: "d", header: "دپارتمان", cell: (t) => t.department.name },
    { key: "p", header: "اولویت", cell: (t) => <StatusBadge tone={PRIORITY[t.priority][0]}>{PRIORITY[t.priority][1]}</StatusBadge> },
    { key: "st", header: "وضعیت", cell: (t) => <StatusBadge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</StatusBadge> },
    { key: "upd", header: "آخرین فعالیت", cell: (t) => <span className="text-muted-foreground">{formatDateTime(t.updatedAt)}</span> },
  ];
  return (
    <DataTable
      basePath="/admin/tickets"
      searchParams={sp}
      rows={rows}
      total={total}
      page={p.page}
      pageSize={p.pageSize}
      columns={columns}
      rowHref={(t) => `/admin/tickets/${t.id}`}
      searchPlaceholder="موضوع، موبایل یا شماره"
      filters={[
        { key: "status", label: "وضعیت", options: [{ value: "active", label: "نیازمند پاسخ" }, ...Object.entries(TICKET_STATUS).map(([value, v]) => ({ value, label: v.label }))] },
        { key: "priority", label: "اولویت", options: Object.entries(PRIORITY).map(([value, [, label]]) => ({ value, label })) },
        { key: "department", label: "دپارتمان", options: deps.map((d) => ({ value: d.id, label: d.name })) },
      ]}
    />
  );
}

async function Canned() {
  const items = await db.cannedReply.findMany({ orderBy: { title: "asc" } });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="پاسخ آماده‌ی جدید">
        <ActionForm action={saveCannedReply.bind(null, null)} resetOnSuccess submitLabel="افزودن">
          <Field label="عنوان" name="title" required />
          <TextArea label="متن ({{name}} = نام مشتری)" name="body" rows={4} required />
        </ActionForm>
      </Card>
      {items.map((c) => (
        <Card key={c.id} title={c.title} actions={<DeleteButton action={deleteCannedReply.bind(null, c.id)} />}>
          <ActionForm action={saveCannedReply.bind(null, c.id)}>
            <Field label="عنوان" name="title" required defaultValue={c.title} />
            <TextArea label="متن" name="body" rows={4} required defaultValue={c.body} />
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}

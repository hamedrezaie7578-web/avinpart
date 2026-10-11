import type { Prisma } from "@prisma/client";
import { Download } from "lucide-react";
import { AdminPage, Card, Tabs } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ActionButton, DeleteButton } from "@/components/admin/form";
import { db } from "@/lib/db";
import { formatDateTime, formatNumber } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { requireAdmin } from "@/server/admin/guard";
import { paging, parseList } from "@/server/admin/list";
import { deleteBackup, runBackup } from "@/server/actions/admin/backups";

export const metadata = { title: "لاگ و پشتیبان‌گیری" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin("audit.read");
  const sp = await searchParams;
  const tab = sp.tab === "backups" ? "backups" : "log";
  return (
    <AdminPage title="لاگ فعالیت‌ها و پشتیبان‌گیری">
      <Tabs base="/admin/audit" tabs={[{ key: "log", label: "لاگ فعالیت مدیران" }, { key: "backups", label: "پشتیبان‌گیری" }]} active={tab} />
      {tab === "log" ? <Log sp={sp} /> : <Backups canBackup={hasPermission(admin.permissions, "audit.backup")} />}
    </AdminPage>
  );
}

async function Log({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const p = parseList(sp, { pageSize: 50 });
  const where: Prisma.AuditLogWhereInput = {
    ...(p.f.entity ? { entity: p.f.entity } : {}),
    ...(p.f.user ? { userId: p.f.user } : {}),
    ...(p.q ? { OR: [{ action: { contains: p.q } }, { entityId: p.q }] } : {}),
  };
  const [rows, total, entities, admins] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, ...paging(p), include: { user: { select: { name: true, mobile: true } } } }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({ distinct: ["entity"], select: { entity: true } }),
    db.user.findMany({ where: { type: "ADMIN" }, select: { id: true, name: true, mobile: true } }),
  ]);
  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    { key: "t", header: "زمان", cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</span> },
    { key: "u", header: "مدیر", cell: (r) => r.user?.name ?? r.user?.mobile ?? "سیستم" },
    { key: "a", header: "عملیات", cell: (r) => <span className="font-mono text-xs" dir="ltr">{r.action}</span> },
    { key: "e", header: "موجودیت", cell: (r) => <span className="font-mono text-xs" dir="ltr">{r.entity}{r.entityId ? ` · ${r.entityId.slice(0, 12)}` : ""}</span> },
    {
      key: "d",
      header: "جزئیات",
      className: "max-w-md",
      cell: (r) =>
        r.diff ? (
          <details>
            <summary className="cursor-pointer text-xs text-primary">مشاهده</summary>
            <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-muted p-2 text-[11px] leading-5" dir="ltr">{JSON.stringify(r.diff, null, 2)}</pre>
          </details>
        ) : (
          "—"
        ),
    },
  ];
  return (
    <DataTable
      basePath="/admin/audit"
      searchParams={sp}
      rows={rows}
      total={total}
      page={p.page}
      pageSize={p.pageSize}
      columns={columns}
      searchPlaceholder="نام عملیات یا شناسه"
      filters={[
        { key: "entity", label: "موجودیت", options: entities.map((e) => ({ value: e.entity, label: e.entity })) },
        { key: "user", label: "مدیر", options: admins.map((a) => ({ value: a.id, label: a.name ?? a.mobile })) },
      ]}
    />
  );
}

async function Backups({ canBackup }: { canBackup: boolean }) {
  const items = await db.backup.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <Card title="نسخه‌های پشتیبان دیتابیس" actions={canBackup && <ActionButton action={runBackup} variant="default">پشتیبان‌گیری اکنون</ActionButton>}>
      <p className="mb-4 text-sm text-muted-foreground">پشتیبان کامل PostgreSQL با pg_dump. پشتیبان خودکار روزانه از طریق سرویس cron در docker-compose انجام می‌شود و {formatNumber(Number(process.env.BACKUP_KEEP || 14))} نسخه‌ی آخر نگه داشته می‌شود. برای بازیابی: <code dir="ltr" className="rounded bg-muted px-1">pg_restore --clean -d DATABASE_URL file.dump</code></p>
      <ul className="divide-y">
        {items.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
            <span className="font-mono text-xs" dir="ltr">{b.file}</span>
            <span className="text-muted-foreground">{formatNumber(Math.round(b.size / 1024))} KB · {formatDateTime(b.createdAt)}</span>
            {canBackup && (
              <span className="ms-auto flex gap-1">
                <a href={`/api/admin/backups/${b.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-sm hover:bg-accent"><Download className="size-4" aria-hidden />دانلود</a>
                <DeleteButton action={deleteBackup.bind(null, b.id)} label="" />
              </span>
            )}
          </li>
        ))}
        {!items.length && <li className="py-6 text-center text-sm text-muted-foreground">هنوز پشتیبانی گرفته نشده است.</li>}
      </ul>
    </Card>
  );
}

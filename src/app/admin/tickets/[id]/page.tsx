import Link from "next/link";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { AdminPage, Card, DL } from "@/components/admin/ui";
import { ActionForm, Select } from "@/components/admin/form";
import { StaffReply } from "@/components/admin/staff-reply";
import { StatusBadge, TICKET_PRIORITY as PRIORITY, TICKET_STATUS } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/guard";
import { updateTicket } from "@/server/actions/admin/tickets";

export const metadata = { title: "تیکت" };

export default async function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("tickets.read");
  const { id } = await params;
  const [t, deps, canned] = await Promise.all([
    db.ticket.findUnique({
      where: { id },
      include: { user: true, department: true, messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, mobile: true } }, attachments: true } } },
    }),
    db.department.findMany(),
    db.cannedReply.findMany({ orderBy: { title: "asc" } }),
  ]);
  if (!t) notFound();
  const license = t.licenseId ? await db.license.findUnique({ where: { id: t.licenseId }, include: { product: true, plan: true } }) : null;
  const [otherTickets, licenses] = await Promise.all([
    db.ticket.count({ where: { userId: t.userId, id: { not: t.id } } }),
    db.license.count({ where: { userId: t.userId, status: "ACTIVE" } }),
  ]);
  return (
    <AdminPage title={`#${toFaDigits(t.number)} — ${t.subject}`} back={{ href: "/admin/tickets", label: "تیکت‌ها" }} actions={<StatusBadge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</StatusBadge>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <ol className="space-y-3">
            {t.messages.map((m) => (
              <li key={m.id} className={cn("max-w-[90%] rounded-2xl border p-4", m.isStaff ? "ms-auto bg-primary/5" : "me-auto bg-card")}>
                <p className="mb-2 text-xs text-muted-foreground"><b className="text-foreground">{m.isStaff ? `کارشناس: ${m.author.name ?? m.author.mobile}` : m.author.name ?? m.author.mobile}</b> · {formatDateTime(m.createdAt)}</p>
                <p className="whitespace-pre-line text-sm leading-7">{m.body}</p>
                {m.attachments.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {m.attachments.map((a) => <li key={a.id}><a href={`/api/attachments/${a.id}`} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:border-primary"><Paperclip className="size-3.5" aria-hidden />{a.alt ?? "پیوست"}</a></li>)}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <Card title="پاسخ">
            <StaffReply ticketId={t.id} canned={canned} customerName={t.user.name ?? "مشتری"} />
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="مشتری">
            <DL
              items={[
                ["نام", <Link key="n" href={`/admin/customers/${t.userId}`} className="text-primary hover:underline">{t.user.name ?? "—"}</Link>],
                ["موبایل", <span key="m" dir="ltr">{t.user.mobile}</span>],
                ["کسب‌وکار", t.user.businessName ?? "—"],
                ["لایسنس فعال", toFaDigits(licenses)],
                ["تیکت‌های دیگر", toFaDigits(otherTickets)],
                ...(license ? ([["لایسنس مرتبط", <Link key="l" href={`/admin/licenses/${license.id}`} className="text-primary hover:underline">{license.product.name} — {license.plan.name}</Link>]] as Array<[string, React.ReactNode]>) : []),
              ]}
            />
          </Card>
          <Card title="تنظیمات تیکت">
            <ActionForm action={updateTicket.bind(null, t.id)}>
              <Select label="وضعیت" name="status" defaultValue={t.status} options={Object.entries(TICKET_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
              <Select label="اولویت" name="priority" defaultValue={t.priority} options={Object.entries(PRIORITY).map(([value, [, label]]) => ({ value, label }))} />
              <Select label="دپارتمان" name="departmentId" defaultValue={t.departmentId} options={deps.map((d) => ({ value: d.id, label: d.name }))} />
            </ActionForm>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

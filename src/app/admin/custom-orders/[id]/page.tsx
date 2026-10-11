import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { AdminPage, Card, DL } from "@/components/admin/ui";
import { ActionForm, Check, Field, Select, TextArea } from "@/components/admin/form";
import { CUSTOM_ORDER_STATUS, PLATFORM_LABEL, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { addCustomOrderNote, updateCustomOrder } from "@/server/actions/admin/custom-orders";

export const metadata = { title: "سفارش اختصاصی" };

export default async function CustomOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("customOrders.read");
  const { id } = await params;
  const [o, admins] = await Promise.all([
    db.customOrder.findUnique({
      where: { id },
      include: { attachments: true, notes: { orderBy: { createdAt: "desc" } }, events: { orderBy: { createdAt: "desc" } }, user: { select: { id: true, name: true } } },
    }),
    db.user.findMany({ where: { type: "ADMIN", isBlocked: false }, select: { id: true, name: true, mobile: true } }),
  ]);
  if (!o) notFound();
  const authors = new Map(admins.map((a) => [a.id, a.name ?? a.mobile]));
  const st = CUSTOM_ORDER_STATUS[o.status];
  return (
    <AdminPage title={`${o.businessName || o.contactName}`} description={<span dir="ltr">{o.trackingCode}</span>} back={{ href: "/admin/custom-orders", label: "سفارش‌های اختصاصی" }} actions={<StatusBadge tone={st.tone}>{st.label}</StatusBadge>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="جزئیات درخواست">
            <DL
              items={[
                ["نوع", o.type === "WEBSITE" ? "طراحی سایت" : "نرم‌افزار اختصاصی"],
                ["نام", o.contactName],
                ["موبایل", <a key="m" href={`tel:${o.mobile}`} dir="ltr">{o.mobile}</a>],
                ["ایمیل", o.email ?? "—"],
                ["حوزه‌ی کسب‌وکار", o.businessField ?? "—"],
                ["نوع پروژه", o.projectTypes.join("، ") || "—"],
                ["پلتفرم", o.platforms.map((p) => PLATFORM_LABEL[p]).join("، ") || "—"],
                ["بودجه", o.budgetRange],
                ["زمان‌بندی", o.timeline],
                ["ثبت", formatDateTime(o.createdAt)],
              ]}
            />
            {o.features.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-bold">امکانات خواسته‌شده</p>
                <ul className="flex flex-wrap gap-2">{o.features.map((f) => <li key={f} className="rounded-lg bg-muted px-2 py-1 text-xs">{f}</li>)}</ul>
              </div>
            )}
            <p className="mt-4 text-sm font-bold">شرح</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-7">{o.description}</p>
            {o.attachments.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {o.attachments.map((a) => (
                  <li key={a.id}><a href={`/api/attachments/${a.id}`} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:border-primary"><Paperclip className="size-4" aria-hidden />{a.alt ?? "پیوست"}</a></li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="یادداشت‌های داخلی (فقط مدیران)">
            <ActionForm action={addCustomOrderNote.bind(null, id)} resetOnSuccess submitLabel="ثبت یادداشت">
              <TextArea label="یادداشت" name="body" rows={3} required />
            </ActionForm>
            <ul className="mt-4 space-y-3">
              {o.notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                  <p className="whitespace-pre-line leading-7">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{authors.get(n.authorId) ?? "—"} · {formatDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="مدیریت سفارش">
            <ActionForm action={updateCustomOrder.bind(null, id)}>
              <Select label="وضعیت" name="status" defaultValue={o.status} options={Object.entries(CUSTOM_ORDER_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
              <TextArea label="پیام برای مشتری (در تایم‌لاین)" name="eventMessage" rows={2} />
              <Check name="notify" label="ارسال پیامک تغییر وضعیت" defaultChecked />
              <Select label="کارشناس مسئول" name="assigneeId" defaultValue={o.assigneeId ?? ""} options={[{ value: "", label: "— تعیین نشده —" }, ...admins.map((a) => ({ value: a.id, label: a.name ?? a.mobile }))]} />
              <Field label="مبلغ پیش‌فاکتور (تومان)" name="quoteAmount" inputMode="numeric" dir="ltr" defaultValue={o.quoteAmount ?? ""} />
              <input type="hidden" name="quoteFileId" value={o.quoteFileId ?? ""} />
            </ActionForm>
          </Card>
          <Card title="تایم‌لاین (قابل مشاهده برای مشتری)">
            <ol className="space-y-3 border-s ps-4">
              {o.events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-bold">{CUSTOM_ORDER_STATUS[e.status].label}</p>
                  {e.message && <p className="text-muted-foreground">{e.message}</p>}
                  <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

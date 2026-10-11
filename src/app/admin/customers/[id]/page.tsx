import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage, Card } from "@/components/admin/ui";
import { ActionButton, ActionForm, Field } from "@/components/admin/form";
import { CUSTOM_ORDER_STATUS, LICENSE_STATUS, ORDER_STATUS, StatusBadge, TICKET_STATUS } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatNumber, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { setCustomerBlocked, updateCustomer } from "@/server/actions/admin/customers";

export const metadata = { title: "پرونده‌ی مشتری" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("customers.read");
  const { id } = await params;
  const u = await db.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      licenses: { include: { product: true, plan: true }, orderBy: { createdAt: "desc" } },
      tickets: { orderBy: { updatedAt: "desc" }, take: 10 },
      customOrders: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!u) notFound();
  const paidTotal = u.orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.total, 0);
  return (
    <AdminPage
      title={u.name || toFaDigits(u.mobile)}
      description={`${toFaDigits(u.mobile)} · عضویت ${formatDate(u.createdAt)} · مجموع خرید ${formatNumber(paidTotal)} تومان`}
      back={{ href: "/admin/customers", label: "مشتریان" }}
      actions={
        u.type === "CUSTOMER" && (
          <ActionButton action={setCustomerBlocked.bind(null, u.id, !u.isBlocked)} confirm={u.isBlocked ? "رفع مسدودیت؟" : "این کاربر مسدود شود؟ دیگر نمی‌تواند وارد شود."} className={u.isBlocked ? "" : "text-destructive"}>
            {u.isBlocked ? "رفع مسدودیت" : "مسدود کردن"}
          </ActionButton>
        )
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card title="اطلاعات">
          <ActionForm action={updateCustomer.bind(null, u.id)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام" name="name" defaultValue={u.name ?? ""} />
              <Field label="ایمیل" name="email" dir="ltr" defaultValue={u.email ?? ""} />
              <Field label="کسب‌وکار" name="businessName" defaultValue={u.businessName ?? ""} />
              <Field label="شهر" name="city" defaultValue={u.city ?? ""} />
              <Field label="شناسه‌ی ملی" name="nationalId" dir="ltr" defaultValue={u.nationalId ?? ""} />
              <Field label="کد اقتصادی" name="economicCode" dir="ltr" defaultValue={u.economicCode ?? ""} />
              <Field label="نشانی" name="address" className="sm:col-span-2" defaultValue={u.address ?? ""} />
            </div>
          </ActionForm>
        </Card>
        <div className="space-y-4">
          <Card title="لایسنس‌ها">
            <ul className="divide-y text-sm">
              {u.licenses.map((l) => (
                <li key={l.id}><Link href={`/admin/licenses/${l.id}`} className="flex flex-wrap items-center gap-2 py-2 hover:text-primary"><span className="font-mono text-xs" dir="ltr">{l.key}</span><span>{l.product.name} · {l.plan.name}</span><span className="ms-auto"><StatusBadge tone={LICENSE_STATUS[l.status].tone}>{LICENSE_STATUS[l.status].label}</StatusBadge></span></Link></li>
              ))}
              {!u.licenses.length && <li className="py-2 text-muted-foreground">—</li>}
            </ul>
          </Card>
          <Card title="سفارش‌ها">
            <ul className="divide-y text-sm">
              {u.orders.map((o) => (
                <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center gap-2 py-2 hover:text-primary">#{toFaDigits(o.number)}<span className="text-muted-foreground">{formatDate(o.createdAt)}</span><span className="ms-auto">{formatNumber(o.total)}</span><StatusBadge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</StatusBadge></Link></li>
              ))}
              {!u.orders.length && <li className="py-2 text-muted-foreground">—</li>}
            </ul>
          </Card>
          <Card title="تیکت‌ها و سفارش‌های اختصاصی">
            <ul className="divide-y text-sm">
              {u.tickets.map((t) => (
                <li key={t.id}><Link href={`/admin/tickets/${t.id}`} className="flex items-center gap-2 py-2 hover:text-primary">تیکت #{toFaDigits(t.number)} {t.subject}<span className="ms-auto"><StatusBadge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</StatusBadge></span></Link></li>
              ))}
              {u.customOrders.map((c) => (
                <li key={c.id}><Link href={`/admin/custom-orders/${c.id}`} className="flex items-center gap-2 py-2 hover:text-primary"><span dir="ltr">{c.trackingCode}</span><span className="ms-auto"><StatusBadge tone={CUSTOM_ORDER_STATUS[c.status].tone}>{CUSTOM_ORDER_STATUS[c.status].label}</StatusBadge></span></Link></li>
              ))}
              {!u.tickets.length && !u.customOrders.length && <li className="py-2 text-muted-foreground">—</li>}
            </ul>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

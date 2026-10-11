import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage, Card, DL } from "@/components/admin/ui";
import { OrderActions } from "@/components/admin/order-actions";
import { ActionForm, TextArea } from "@/components/admin/form";
import { LICENSE_STATUS, ORDER_STATUS, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime, formatNumber, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { updateOrderNote } from "@/server/actions/admin/orders";

export const metadata = { title: "جزئیات سفارش" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("orders.read");
  const { id } = await params;
  const o = await db.order.findUnique({
    where: { id },
    include: { user: true, coupon: true, items: { include: { plan: true, product: true, license: true } }, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!o) notFound();
  const st = ORDER_STATUS[o.status];
  const save = updateOrderNote.bind(null, o.id);
  return (
    <AdminPage title={`سفارش #${toFaDigits(o.number)}`} back={{ href: "/admin/orders", label: "سفارش‌ها" }} actions={<StatusBadge tone={st.tone}>{st.label}</StatusBadge>}>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card title="اقلام">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {o.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2">{it.title}</td>
                    <td className="py-2">
                      {it.license ? (
                        <Link href={`/admin/licenses/${it.license.id}`} className="font-mono text-xs text-primary hover:underline" dir="ltr">{it.license.key}</Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">بدون لایسنس</span>
                      )}
                      {it.license && <span className="ms-2"><StatusBadge tone={LICENSE_STATUS[it.license.status].tone}>{LICENSE_STATUS[it.license.status].label}</StatusBadge></span>}
                    </td>
                    <td className="py-2 text-end">{formatNumber(it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ms-auto mt-4 max-w-xs space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt>جمع</dt><dd>{formatNumber(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt>تخفیف {o.coupon && `(${o.coupon.code})`}</dt><dd>− {formatNumber(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt>مالیات</dt><dd>{formatNumber(o.tax)}</dd></div>
              <div className="flex justify-between font-black"><dt>مبلغ کل</dt><dd>{formatNumber(o.total)} تومان</dd></div>
            </dl>
          </Card>
          <Card title="تراکنش‌ها">
            {o.payments.length ? (
              <table className="w-full text-sm">
                <thead className="text-muted-foreground"><tr><th className="py-1 text-start font-medium">درگاه</th><th className="text-start font-medium">مبلغ</th><th className="text-start font-medium">وضعیت</th><th className="text-start font-medium">کد پیگیری</th><th className="text-start font-medium">زمان</th></tr></thead>
                <tbody className="divide-y">
                  {o.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2">{p.gateway}</td>
                      <td>{formatNumber(p.amount)}</td>
                      <td>{p.status}</td>
                      <td dir="ltr" className="text-start">{p.refId ?? "—"}{p.cardPan ? ` · ${p.cardPan}` : ""}</td>
                      <td className="text-muted-foreground">{formatDateTime(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">تراکنشی ثبت نشده است.</p>
            )}
          </Card>
          <Card title="عملیات"><OrderActions orderId={o.id} status={o.status} /></Card>
        </div>
        <div className="space-y-4">
          <Card title="مشتری" actions={<Link href={`/admin/customers/${o.userId}`} className="text-sm font-bold text-primary">پرونده</Link>}>
            <DL items={[["نام", o.user.name], ["موبایل", toFaDigits(o.user.mobile)], ["کسب‌وکار", o.user.businessName], ["کد اقتصادی", o.user.economicCode]]} />
          </Card>
          <Card title="اطلاعات سفارش">
            <DL items={[["نوع", o.kind], ["ثبت", formatDateTime(o.createdAt)], ["پرداخت", o.paidAt ? formatDateTime(o.paidAt) : "—"]]} />
          </Card>
          <Card title="یادداشت داخلی">
            <ActionForm action={save}>
              <TextArea label="یادداشت" name="note" defaultValue={o.note ?? ""} />
            </ActionForm>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}

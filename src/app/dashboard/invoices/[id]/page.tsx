import { notFound } from "next/navigation";
import { LogoMark } from "@/components/layout/logo";
import { PrintButton } from "@/components/dashboard/print-button";
import { ORDER_STATUS, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatNumber, toFaDigits } from "@/lib/format";
import { getSettings } from "@/server/queries/settings";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "فاکتور" };

/** فاکتور قابل چاپ (با استایل print؛ از مرورگر به PDF ذخیره می‌شود) */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomer("/dashboard/invoices");
  const [order, s] = await Promise.all([
    db.order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: { include: { product: true, plan: true } },
        payments: { where: { status: "SUCCESS" }, take: 1 },
        coupon: true,
      },
    }),
    getSettings(),
  ]);
  if (!order) notFound();
  const pay = order.payments[0];
  const st = ORDER_STATUS[order.status];

  return (
    <div>
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <article
        className="bg-card rounded-2xl border p-6 md:p-10 print:border-0 print:p-0 print:shadow-none"
        aria-label={`فاکتور شماره‌ی ${order.number}`}
      >
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-12" />
            <div>
              <p className="text-xl font-black" dir="ltr" style={{ textAlign: "right" }}>
                AvinApps
              </p>
              <p className="text-muted-foreground text-sm">{s.address}</p>
              <p className="text-muted-foreground text-sm">
                {s.phone} · {s.email}
              </p>
            </div>
          </div>
          <div className="text-end">
            <h1 className="text-2xl font-black">فاکتور فروش</h1>
            <p className="mt-1 text-sm">
              شماره: <strong>{toFaDigits(order.number)}</strong>
            </p>
            <p className="text-sm">تاریخ: {formatDate(order.paidAt ?? order.createdAt)}</p>
            <div className="mt-2">
              <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
            </div>
          </div>
        </header>
        <section className="grid gap-4 border-b py-6 text-sm sm:grid-cols-2">
          <div>
            <h2 className="mb-2 font-bold">خریدار</h2>
            <p>{user.businessName || user.name || "—"}</p>
            {user.businessName && user.name && <p>{user.name}</p>}
            <p dir="ltr" style={{ textAlign: "right" }}>
              {toFaDigits(user.mobile)}
            </p>
            {user.nationalId && <p>شناسه‌ی ملی: {toFaDigits(user.nationalId)}</p>}
            {user.economicCode && <p>کد اقتصادی: {toFaDigits(user.economicCode)}</p>}
            {user.address && <p>{user.address}</p>}
          </div>
          {pay && (
            <div>
              <h2 className="mb-2 font-bold">اطلاعات پرداخت</h2>
              <p>زمان: {formatDateTime(pay.verifiedAt ?? pay.createdAt)}</p>
              {pay.refId && (
                <p>
                  کد پیگیری: <span dir="ltr">{pay.refId}</span>
                </p>
              )}
              {pay.cardPan && (
                <p>
                  کارت: <span dir="ltr">{pay.cardPan}</span>
                </p>
              )}
            </div>
          )}
        </section>
        <table className="mt-6 w-full text-sm">
          <thead className="text-muted-foreground border-b">
            <tr>
              <th scope="col" className="py-2 text-start font-medium">
                ردیف
              </th>
              <th scope="col" className="py-2 text-start font-medium">
                شرح کالا / خدمت
              </th>
              <th scope="col" className="py-2 text-end font-medium">
                مبلغ (تومان)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((it, i) => (
              <tr key={it.id}>
                <td className="py-3">{toFaDigits(i + 1)}</td>
                <td className="py-3">{it.title}</td>
                <td className="py-3 text-end">{formatNumber(it.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ms-auto mt-6 max-w-xs space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt>جمع</dt>
            <dd>{formatNumber(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt>تخفیف{order.coupon ? ` (${order.coupon.code})` : ""}</dt>
              <dd>− {formatNumber(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>مالیات بر ارزش افزوده</dt>
            <dd>{formatNumber(order.tax)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-black">
            <dt>مبلغ کل</dt>
            <dd>{formatNumber(order.total)} تومان</dd>
          </div>
        </dl>
        <p className="text-muted-foreground mt-10 text-center text-xs">
          این فاکتور به‌صورت الکترونیکی صادر شده و فاقد مهر و امضا معتبر است.
        </p>
      </article>
    </div>
  );
}

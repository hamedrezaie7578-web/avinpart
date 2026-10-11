import Link from "next/link";
import { CircleDollarSign, Headphones, ShoppingBag, UserPlus } from "lucide-react";
import { format } from "date-fns-jalali";
import { AdminPage, Card, Stat } from "@/components/admin/ui";
import { BarsChart, RevenueChart } from "@/components/admin/charts";
import { ORDER_STATUS, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatNumber, formatPriceShort, formatRelative, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "داشبورد" };
export const dynamic = "force-dynamic";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  await requireAdmin("dashboard.read");
  const { denied } = await searchParams;
  const now = new Date();
  const today = startOfDay();
  const d30 = new Date(today.getTime() - 29 * 86400_000);
  const month = new Date(today.getTime() - 30 * 86400_000);
  const year = new Date(today.getTime() - 365 * 86400_000);
  const paid = { status: "PAID" as const };

  const [sToday, sMonth, sYear, ordersMonth, ordersAllMonth, newCustomers, openTickets, newCustom, newLeads, daily, topItems, recent] = await Promise.all([
    db.order.aggregate({ where: { ...paid, paidAt: { gte: today } }, _sum: { total: true } }),
    db.order.aggregate({ where: { ...paid, paidAt: { gte: month } }, _sum: { total: true } }),
    db.order.aggregate({ where: { ...paid, paidAt: { gte: year } }, _sum: { total: true } }),
    db.order.count({ where: { ...paid, paidAt: { gte: month } } }),
    db.order.count({ where: { createdAt: { gte: month } } }),
    db.user.count({ where: { type: "CUSTOMER", createdAt: { gte: month } } }),
    db.ticket.count({ where: { status: { in: ["OPEN", "CUSTOMER_REPLY"] } } }),
    db.customOrder.count({ where: { status: "NEW" } }),
    db.lead.count({ where: { isHandled: false, type: { in: ["DEMO", "CONSULT", "CONTACT"] } } }),
    db.$queryRaw<Array<{ day: Date; total: bigint }>>`
      SELECT date_trunc('day', "paidAt") AS day, SUM(total)::bigint AS total
      FROM "Order" WHERE status = 'PAID' AND "paidAt" >= ${d30}
      GROUP BY 1 ORDER BY 1`,
    db.orderItem.groupBy({ by: ["productId"], where: { order: { ...paid, paidAt: { gte: month } } }, _sum: { unitPrice: true }, _count: true, orderBy: { _sum: { unitPrice: "desc" } }, take: 6 }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
  ]);

  const byDay = new Map(daily.map((d) => [startOfDay(d.day).getTime(), Number(d.total)]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(d30.getTime() + i * 86400_000);
    return { label: toFaDigits(format(d, "d MMM")), value: byDay.get(d.getTime()) ?? 0 };
  });
  const products = await db.product.findMany({ where: { id: { in: topItems.map((t) => t.productId) } }, select: { id: true, name: true } });
  const top = topItems.map((t) => ({ label: products.find((p) => p.id === t.productId)?.name ?? "—", value: t._sum.unitPrice ?? 0, count: t._count }));
  const conversion = ordersAllMonth ? Math.round((ordersMonth / ordersAllMonth) * 100) : 0;

  return (
    <AdminPage title="داشبورد" description={`امروز ${toFaDigits(format(now, "EEEE d MMMM yyyy"))}`}>
      {denied && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">شما به این بخش دسترسی ندارید.</p>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="فروش امروز" value={formatPriceShort(sToday._sum.total ?? 0)} icon={<CircleDollarSign className="size-4" aria-hidden />} />
        <Stat label="فروش ۳۰ روز" value={formatPriceShort(sMonth._sum.total ?? 0)} hint={`${toFaDigits(ordersMonth)} سفارش موفق`} />
        <Stat label="فروش یک سال" value={formatPriceShort(sYear._sum.total ?? 0)} />
        <Stat label="نرخ تبدیل سفارش به پرداخت" value={`${toFaDigits(conversion)}٪`} hint="سفارش‌های ۳۰ روز اخیر" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/admin/customers"><Stat label="مشتریان جدید (۳۰ روز)" value={toFaDigits(newCustomers)} icon={<UserPlus className="size-4" aria-hidden />} /></Link>
        <Link href="/admin/tickets"><Stat label="تیکت‌های منتظر پاسخ" value={toFaDigits(openTickets)} icon={<Headphones className="size-4" aria-hidden />} /></Link>
        <Link href="/admin/custom-orders"><Stat label="سفارش اختصاصی جدید" value={toFaDigits(newCustom)} icon={<ShoppingBag className="size-4" aria-hidden />} /></Link>
        <Link href="/admin/forms"><Stat label="درخواست‌های بررسی‌نشده" value={toFaDigits(newLeads)} /></Link>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card title="درآمد روزانه — ۳۰ روز اخیر (تومان)">
          <RevenueChart data={series} />
        </Card>
        <Card title="پرفروش‌ترین محصولات (۳۰ روز)">
          {top.length ? (
            <>
              <BarsChart data={top} />
              <table className="mt-4 w-full text-sm">
                <caption className="sr-only">جدول فروش محصولات</caption>
                <tbody className="divide-y">
                  {top.map((t) => (
                    <tr key={t.label}>
                      <th scope="row" className="py-1.5 text-start font-medium" dir="ltr">{t.label}</th>
                      <td className="py-1.5 text-muted-foreground">{toFaDigits(t.count)} فروش</td>
                      <td className="py-1.5 text-end">{formatNumber(t.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">هنوز فروشی در این بازه ثبت نشده است.</p>
          )}
        </Card>
      </div>
      <Card title="آخرین سفارش‌ها" className="mt-4" actions={<Link href="/admin/orders" className="text-sm font-bold text-primary">همه</Link>}>
        <ul className="divide-y text-sm">
          {recent.length ? (
            recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-3 py-2.5 hover:text-primary">
                  <span className="font-bold">#{toFaDigits(o.number)}</span>
                  <span>{o.user.name || toFaDigits(o.user.mobile)}</span>
                  <span className="text-muted-foreground">{formatRelative(o.createdAt)}</span>
                  <span className="ms-auto">{formatNumber(o.total)} تومان</span>
                  <StatusBadge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</StatusBadge>
                </Link>
              </li>
            ))
          ) : (
            <li className="py-6 text-center text-muted-foreground">سفارشی ثبت نشده است.</li>
          )}
        </ul>
      </Card>
    </AdminPage>
  );
}

import { FileSpreadsheet } from "lucide-react";
import { AdminPage, Card, Stat } from "@/components/admin/ui";
import { BarsChart } from "@/components/admin/charts";
import { db } from "@/lib/db";
import { formatNumber, formatPriceShort, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "گزارش‌ها" };

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requireAdmin("reports.read");
  const sp = await searchParams;
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : new Date();
  const from = sp.from ? new Date(sp.from) : new Date(to.getTime() - 30 * 86400_000);
  const where = { status: "PAID" as const, paidAt: { gte: from, lte: to } };

  const [agg, byProduct, byPlan, byKind, refunds] = await Promise.all([
    db.order.aggregate({ where, _sum: { total: true, discount: true, tax: true }, _count: true, _avg: { total: true } }),
    db.orderItem.groupBy({ by: ["productId"], where: { order: where }, _sum: { unitPrice: true }, _count: true, orderBy: { _sum: { unitPrice: "desc" } } }),
    db.orderItem.groupBy({ by: ["planId"], where: { order: where }, _sum: { unitPrice: true }, _count: true, orderBy: { _sum: { unitPrice: "desc" } } }),
    db.order.groupBy({ by: ["kind"], where, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { status: "REFUNDED", paidAt: { gte: from, lte: to } }, _sum: { total: true }, _count: true }),
  ]);
  const [products, plans] = await Promise.all([
    db.product.findMany({ where: { id: { in: byProduct.map((x) => x.productId) } }, select: { id: true, name: true } }),
    db.plan.findMany({ where: { id: { in: byPlan.map((x) => x.planId) } }, select: { id: true, name: true } }),
  ]);
  const prodRows = byProduct.map((x) => ({ label: products.find((p) => p.id === x.productId)?.name ?? "—", value: x._sum.unitPrice ?? 0, count: x._count }));
  const planRows = byPlan.map((x) => ({ label: plans.find((p) => p.id === x.planId)?.name ?? "—", value: x._sum.unitPrice ?? 0, count: x._count }));
  const KIND = { PURCHASE: "خرید جدید", UPGRADE: "ارتقا", RENEWAL: "تمدید" } as const;
  const qs = `from=${iso(from)}&to=${iso(to)}`;

  return (
    <AdminPage
      title="گزارش فروش"
      actions={
        <a href={`/api/admin/export/orders?${qs}&f_status=PAID`} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-background px-4 text-sm font-bold hover:bg-accent">
          <FileSpreadsheet className="size-4 text-success" aria-hidden />
          خروجی Excel سفارش‌های این بازه
        </a>
      }
    >
      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4" method="get">
        <label className="text-sm"><span className="mb-1 block text-muted-foreground">از تاریخ</span><input type="date" name="from" defaultValue={iso(from)} className="h-10 rounded-xl border bg-background px-3" /></label>
        <label className="text-sm"><span className="mb-1 block text-muted-foreground">تا تاریخ</span><input type="date" name="to" defaultValue={iso(to)} className="h-10 rounded-xl border bg-background px-3" /></label>
        <button className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">نمایش</button>
      </form>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="فروش خالص" value={formatPriceShort(agg._sum.total ?? 0)} hint={`${toFaDigits(agg._count)} سفارش`} />
        <Stat label="میانگین هر سفارش" value={formatPriceShort(Math.round(agg._avg.total ?? 0))} />
        <Stat label="تخفیف‌های داده‌شده" value={formatPriceShort(agg._sum.discount ?? 0)} />
        <Stat label="بازگشت وجه" value={formatPriceShort(refunds._sum.total ?? 0)} hint={`${toFaDigits(refunds._count)} سفارش`} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="فروش بر اساس محصول (تومان)">
          {prodRows.length ? <BarsChart data={prodRows.slice(0, 12)} /> : <p className="py-8 text-center text-sm text-muted-foreground">بدون داده</p>}
        </Card>
        <Card title="فروش بر اساس پلن">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground"><tr><th className="py-1 text-start font-medium">پلن</th><th className="text-start font-medium">تعداد</th><th className="text-end font-medium">مبلغ (تومان)</th></tr></thead>
            <tbody className="divide-y">{planRows.map((r) => <tr key={r.label}><td className="py-2">{r.label}</td><td>{toFaDigits(r.count)}</td><td className="text-end">{formatNumber(r.value)}</td></tr>)}</tbody>
          </table>
          <h3 className="mt-6 mb-2 text-sm font-bold">بر اساس نوع سفارش</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y">{byKind.map((k) => <tr key={k.kind}><td className="py-2">{KIND[k.kind]}</td><td>{toFaDigits(k._count)}</td><td className="text-end">{formatNumber(k._sum.total ?? 0)}</td></tr>)}</tbody>
          </table>
        </Card>
      </div>
      <Card title="جدول کامل فروش محصولات" className="mt-4">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground"><tr><th className="py-1 text-start font-medium">محصول</th><th className="text-start font-medium">تعداد</th><th className="text-end font-medium">مبلغ (تومان)</th></tr></thead>
          <tbody className="divide-y">{prodRows.map((r) => <tr key={r.label}><td className="py-2" dir="ltr" style={{ textAlign: "right" }}>{r.label}</td><td>{toFaDigits(r.count)}</td><td className="text-end">{formatNumber(r.value)}</td></tr>)}</tbody>
        </table>
      </Card>
    </AdminPage>
  );
}

import { AdminPage } from "@/components/admin/ui";
import { Kanban } from "@/components/admin/kanban";
import { CUSTOM_ORDER_STATUS } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { moveCustomOrder } from "@/server/actions/admin/custom-orders";

export const metadata = { title: "سفارش‌های اختصاصی" };

export default async function CustomOrdersBoard() {
  await requireAdmin("customOrders.read");
  const orders = await db.customOrder.findMany({
    where: { OR: [{ status: { notIn: ["DELIVERED", "CANCELED"] } }, { updatedAt: { gte: new Date(Date.now() - 90 * 864e5) } }] },
    orderBy: [{ boardOrder: "asc" }, { createdAt: "desc" }],
    include: { assignee: { select: { name: true } } },
    take: 500,
  });
  return (
    <AdminPage title="سفارش‌های اختصاصی" description="کارت‌ها را بین ستون‌ها بکشید؛ تغییر وضعیت در تایم‌لاین مشتری ثبت و پیامک می‌شود. سفارش‌های بسته‌شده‌ی قدیمی‌تر از ۹۰ روز نمایش داده نمی‌شوند.">
      <Kanban
        columns={Object.entries(CUSTOM_ORDER_STATUS).map(([key, v]) => ({ key, label: v.label }))}
        onMove={moveCustomOrder}
        initial={orders.map((o) => ({
          id: o.id,
          status: o.status,
          title: o.businessName || o.contactName,
          subtitle: o.description,
          badge: o.type === "WEBSITE" ? "سایت" : "نرم‌افزار",
          meta: [o.trackingCode, formatDate(o.createdAt), o.assignee?.name, o.quoteAmount ? `${formatNumber(o.quoteAmount)} ت` : null].filter(Boolean).join(" · "),
        }))}
      />
    </AdminPage>
  );
}

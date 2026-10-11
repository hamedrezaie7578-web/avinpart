import Link from "next/link";
import { EmptyState } from "@/components/design-system/empty-state";
import { ORDER_STATUS, PageTitle, Panel, StatusBadge } from "@/components/dashboard/ui";
import { PayAgainButton } from "@/components/dashboard/pay-again-button";
import { db } from "@/lib/db";
import { formatDate, formatNumber, toFaDigits } from "@/lib/format";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "فاکتورها" };

const KIND = { PURCHASE: "خرید", UPGRADE: "ارتقا", RENEWAL: "تمدید" } as const;

export default async function InvoicesPage() {
  const user = await requireCustomer("/dashboard/invoices");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageTitle title="فاکتورها و پرداخت‌ها" />
      {!orders.length ? (
        <EmptyState icon="FileText" title="هنوز سفارشی ثبت نکرده‌اید" />
      ) : (
        <Panel className="overflow-x-auto p-0 md:p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b">
              <tr>
                <th scope="col" className="p-4 text-start font-medium">
                  شماره
                </th>
                <th scope="col" className="p-4 text-start font-medium">
                  شرح
                </th>
                <th scope="col" className="p-4 text-start font-medium">
                  تاریخ
                </th>
                <th scope="col" className="p-4 text-start font-medium">
                  مبلغ
                </th>
                <th scope="col" className="p-4 text-start font-medium">
                  وضعیت
                </th>
                <th scope="col" className="p-4">
                  <span className="sr-only">عملیات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-4 font-bold">{toFaDigits(o.number)}</td>
                  <td className="p-4">
                    <span className="text-muted-foreground text-xs">{KIND[o.kind]} · </span>
                    {o.items.map((i) => i.title).join("، ")}
                  </td>
                  <td className="text-muted-foreground p-4 whitespace-nowrap">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="p-4 whitespace-nowrap">{formatNumber(o.total)} تومان</td>
                  <td className="p-4">
                    <StatusBadge tone={ORDER_STATUS[o.status].tone}>
                      {ORDER_STATUS[o.status].label}
                    </StatusBadge>
                  </td>
                  <td className="p-4 text-end whitespace-nowrap">
                    {o.status === "PENDING" ? (
                      <PayAgainButton orderId={o.id} label="پرداخت" />
                    ) : (
                      <Link
                        href={`/dashboard/invoices/${o.id}`}
                        className="text-primary font-bold hover:underline"
                      >
                        مشاهده
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}

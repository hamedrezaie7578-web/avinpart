import Link from "next/link";
import { EmptyState } from "@/components/design-system/empty-state";
import { Button } from "@/components/ui/button";
import { CUSTOM_ORDER_STATUS, PageTitle, Panel, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "سفارش‌های اختصاصی" };

export default async function ProjectsPage() {
  const user = await requireCustomer("/dashboard/projects");
  const orders = await db.customOrder.findMany({
    where: { OR: [{ userId: user.id }, { mobile: user.mobile }] },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageTitle title="سفارش‌های نرم‌افزار و سایت اختصاصی" />
      {!orders.length ? (
        <EmptyState
          icon="Code2"
          title="سفارش اختصاصی ثبت نکرده‌اید"
          description="نرم‌افزار، اپلیکیشن یا سایت اختصاصی می‌خواهید؟ نیازتان را ثبت کنید تا نیازسنجی رایگان انجام دهیم."
          action={
            <div className="flex gap-2">
              <Button asChild className="rounded-xl">
                <Link href="/custom-software#order">نرم‌افزار اختصاصی</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/website-design#order">طراحی سایت</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link key={o.id} href={`/dashboard/projects/${o.id}`} className="block">
              <Panel className="hover:border-primary/50 transition">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold" dir="ltr">
                    {o.trackingCode}
                  </span>
                  <span className="font-bold">
                    {o.type === "WEBSITE" ? "طراحی سایت" : "نرم‌افزار اختصاصی"} — {o.businessField}
                  </span>
                  <span className="ms-auto flex items-center gap-3">
                    <span className="text-muted-foreground text-sm">{formatDate(o.createdAt)}</span>
                    <StatusBadge tone={CUSTOM_ORDER_STATUS[o.status].tone}>
                      {CUSTOM_ORDER_STATUS[o.status].label}
                    </StatusBadge>
                  </span>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Download, FileText, KeyRound, LifeBuoy } from "lucide-react";
import { EmptyState } from "@/components/design-system/empty-state";
import { Button } from "@/components/ui/button";
import { LICENSE_STATUS, PageTitle, Panel, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, toFaDigits } from "@/lib/format";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "پیشخوان" };

export default async function DashboardHome() {
  const user = await requireCustomer();
  const soon = new Date(Date.now() + 30 * 86400_000);
  const [licenses, pendingOrders, openTickets, projects] = await Promise.all([
    db.license.findMany({
      where: { userId: user.id },
      include: { product: true, plan: true },
      orderBy: { createdAt: "desc" },
    }),
    db.order.count({ where: { userId: user.id, status: "PENDING" } }),
    db.ticket.count({ where: { userId: user.id, status: { not: "CLOSED" } } }),
    db.customOrder.count({
      where: { userId: user.id, status: { notIn: ["DELIVERED", "CANCELED"] } },
    }),
  ]);
  const active = licenses.filter((l) => l.status === "ACTIVE");
  const expiring = active.filter((l) => l.expiresAt && l.expiresAt < soon);

  const stats = [
    { label: "لایسنس فعال", value: active.length, href: "/dashboard/licenses", Icon: KeyRound },
    {
      label: "فاکتور در انتظار پرداخت",
      value: pendingOrders,
      href: "/dashboard/invoices",
      Icon: FileText,
    },
    { label: "تیکت باز", value: openTickets, href: "/dashboard/tickets", Icon: LifeBuoy },
    { label: "پروژه‌ی در جریان", value: projects, href: "/dashboard/projects", Icon: Download },
  ];

  return (
    <>
      <PageTitle
        title={`سلام${user.name ? `، ${user.name}` : ""} 👋`}
        description="خلاصه‌ی وضعیت حساب و نرم‌افزارهای شما"
      />
      {!user.name && (
        <p className="border-primary/30 bg-accent/50 mb-6 rounded-2xl border p-4 text-sm">
          برای صدور فاکتور رسمی،{" "}
          <Link href="/dashboard/profile" className="text-primary font-bold hover:underline">
            اطلاعات پروفایل و کسب‌وکار
          </Link>{" "}
          خود را تکمیل کنید.
        </p>
      )}
      {expiring.map((l) => (
        <p
          key={l.id}
          role="alert"
          className="bg-warning/10 text-warning mb-4 flex items-center gap-2 rounded-2xl p-4 text-sm"
        >
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          سرویس {l.product.name} در تاریخ {formatDate(l.expiresAt!)} به پایان می‌رسد.
          <Link href="/dashboard/licenses" className="ms-auto font-bold underline">
            تمدید
          </Link>
        </p>
      ))}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className="bg-card hover:border-primary/50 rounded-2xl border p-5 transition hover:shadow-md"
          >
            <Icon className="text-primary size-6" aria-hidden />
            <p className="mt-3 text-3xl font-black">{toFaDigits(value)}</p>
            <p className="text-muted-foreground mt-1 text-sm">{label}</p>
          </Link>
        ))}
      </div>
      <Panel
        title="نرم‌افزارهای من"
        action={
          licenses.length > 0 && (
            <Link
              href="/dashboard/licenses"
              className="text-primary inline-flex items-center gap-1 text-sm font-bold"
            >
              همه <ArrowLeft className="size-4" aria-hidden />
            </Link>
          )
        }
      >
        {licenses.length ? (
          <ul className="divide-y">
            {licenses.slice(0, 5).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="font-bold" dir="ltr">
                  {l.product.name}
                </span>
                <span className="text-muted-foreground text-sm">{l.plan.name}</span>
                <StatusBadge tone={LICENSE_STATUS[l.status].tone}>
                  {LICENSE_STATUS[l.status].label}
                </StatusBadge>
                <span className="text-muted-foreground ms-auto text-sm">
                  {l.expiresAt ? `تا ${formatDate(l.expiresAt)}` : "دائمی"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="KeyRound"
            title="هنوز نرم‌افزاری نخریده‌اید"
            description="نرم‌افزار مخصوص صنف خود را پیدا کنید؛ کلید لایسنس بلافاصله پس از پرداخت اینجا نمایش داده می‌شود."
            action={
              <Button asChild className="rounded-xl">
                <Link href="/products">مشاهده‌ی محصولات</Link>
              </Button>
            }
          />
        )}
      </Panel>
    </>
  );
}

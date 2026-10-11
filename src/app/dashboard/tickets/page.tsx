import Link from "next/link";
import { EmptyState } from "@/components/design-system/empty-state";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel, StatusBadge, TICKET_STATUS } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatRelative, toFaDigits } from "@/lib/format";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "پشتیبانی" };

export default async function TicketsPage() {
  const user = await requireCustomer("/dashboard/tickets");
  const tickets = await db.ticket.findMany({
    where: { userId: user.id },
    include: { department: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PageTitle
        title="تیکت‌های پشتیبانی"
        description="سؤال یا مشکلی دارید؟ تیکت ثبت کنید؛ معمولاً در کمتر از چند ساعت کاری پاسخ می‌دهیم."
        action={
          <Button asChild className="rounded-xl font-bold">
            <Link href="/dashboard/tickets/new">+ تیکت جدید</Link>
          </Button>
        }
      />
      {!tickets.length ? (
        <EmptyState
          icon="Headphones"
          title="تیکتی ثبت نکرده‌اید"
          action={
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/tickets/new">ثبت اولین تیکت</Link>
            </Button>
          }
        />
      ) : (
        <Panel className="p-0 md:p-0">
          <ul className="divide-y">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/tickets/${t.id}`}
                  className="hover:bg-muted/40 flex flex-wrap items-center gap-3 p-4"
                >
                  <span className="text-muted-foreground text-sm">#{toFaDigits(t.number)}</span>
                  <span className="font-bold">{t.subject}</span>
                  <span className="text-muted-foreground text-xs">{t.department.name}</span>
                  <span className="ms-auto flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {formatRelative(t.updatedAt)}
                    </span>
                    <StatusBadge tone={TICKET_STATUS[t.status].tone}>
                      {TICKET_STATUS[t.status].label}
                    </StatusBadge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

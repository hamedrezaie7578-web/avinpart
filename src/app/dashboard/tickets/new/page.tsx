import { NewTicketForm } from "@/components/dashboard/ticket-forms";
import { PageTitle, Panel } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "تیکت جدید" };

export default async function NewTicketPage() {
  const user = await requireCustomer("/dashboard/tickets/new");
  const [departments, licenses] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.license.findMany({ where: { userId: user.id }, include: { product: true, plan: true } }),
  ]);
  return (
    <>
      <PageTitle title="ثبت تیکت جدید" />
      <Panel>
        <NewTicketForm
          departments={departments}
          licenses={licenses.map((l) => ({
            id: l.id,
            label: `${l.product.name} — ${l.plan.name}`,
          }))}
        />
      </Panel>
    </>
  );
}

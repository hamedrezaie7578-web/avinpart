import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { ReplyForm } from "@/components/dashboard/ticket-forms";
import { PageTitle, Panel, StatusBadge, TICKET_STATUS } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "تیکت" };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomer(`/dashboard/tickets/${id}`);
  const ticket = await db.ticket.findFirst({
    where: { id, userId: user.id },
    include: {
      department: true,
      messages: { orderBy: { createdAt: "asc" }, include: { author: true, attachments: true } },
    },
  });
  if (!ticket) notFound();
  const st = TICKET_STATUS[ticket.status];
  return (
    <>
      <PageTitle
        title={ticket.subject}
        description={`تیکت #${toFaDigits(ticket.number)} · ${ticket.department.name}`}
        action={<StatusBadge tone={st.tone}>{st.label}</StatusBadge>}
      />
      <ol className="space-y-4">
        {ticket.messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              "max-w-3xl rounded-2xl border p-5",
              m.isStaff ? "bg-accent/50 me-auto" : "bg-card ms-auto",
            )}
          >
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="font-bold">
                {m.isStaff
                  ? `پشتیبانی AvinApps${m.author.name ? ` (${m.author.name})` : ""}`
                  : "شما"}
              </span>
              <span className="text-muted-foreground">{formatDateTime(m.createdAt)}</span>
            </div>
            <p className="leading-8 whitespace-pre-line">{m.body}</p>
            {m.attachments.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {m.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={`/api/attachments/${a.id}`}
                      className="bg-muted inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium hover:underline"
                      dir="ltr"
                    >
                      <Paperclip className="size-3" aria-hidden />
                      {a.alt}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <Panel className="mt-6">
        <ReplyForm ticketId={ticket.id} closed={ticket.status === "CLOSED"} />
      </Panel>
    </>
  );
}

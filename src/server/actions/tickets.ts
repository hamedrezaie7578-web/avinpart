"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const ticketSchema = z.object({
  departmentId: z.string().min(1, "دپارتمان را انتخاب کنید"),
  subject: z.string().trim().min(4, "موضوع را کامل بنویسید").max(150),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  licenseId: z.string().optional().or(z.literal("")),
  body: z.string().trim().min(10, "شرح مشکل را کامل‌تر بنویسید").max(5000),
  attachmentIds: z.array(z.string()).max(5).default([]),
});

async function ownAttachments(ids: string[], userId: string) {
  if (!ids.length) return [];
  return db.media.findMany({
    where: {
      id: { in: ids },
      uploadedById: userId,
      path: { startsWith: "tickets/" },
      ticketMessages: { none: {} },
    },
    select: { id: true },
  });
}

export async function createTicket(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, message: "ابتدا وارد شوید." };
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };
  if (!(await rateLimit(`ticket:${session.user.id}`, 10, 3600)).ok)
    return { ok: false as const, message: "تعداد تیکت‌های ثبت‌شده زیاد است؛ کمی بعد تلاش کنید." };
  const d = parsed.data;
  const license = d.licenseId
    ? await db.license.findFirst({ where: { id: d.licenseId, userId: session.user.id } })
    : null;
  const files = await ownAttachments(d.attachmentIds, session.user.id);
  const ticket = await db.ticket.create({
    data: {
      userId: session.user.id,
      departmentId: d.departmentId,
      subject: d.subject,
      priority: d.priority,
      licenseId: license?.id,
      messages: {
        create: { authorId: session.user.id, body: d.body, attachments: { connect: files } },
      },
    },
  });
  await db.adminNotification.create({
    data: {
      type: "ticket",
      title: `تیکت جدید #${ticket.number}: ${d.subject}`,
      href: `/admin/tickets/${ticket.id}`,
    },
  });
  revalidatePath("/dashboard/tickets");
  return { ok: true as const, id: ticket.id };
}

export async function replyTicket(ticketId: string, body: string, attachmentIds: string[] = []) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, message: "ابتدا وارد شوید." };
  const text = String(body ?? "").trim();
  if (text.length < 2) return { ok: false as const, message: "متن پاسخ خالی است." };
  if (text.length > 5000) return { ok: false as const, message: "متن پاسخ طولانی است." };
  const ticket = await db.ticket.findFirst({ where: { id: ticketId, userId: session.user.id } });
  if (!ticket) return { ok: false as const, message: "تیکت یافت نشد." };
  const files = await ownAttachments(attachmentIds.slice(0, 5), session.user.id);
  await db.ticketMessage.create({
    data: { ticketId, authorId: session.user.id, body: text, attachments: { connect: files } },
  });
  await db.ticket.update({ where: { id: ticketId }, data: { status: "CUSTOMER_REPLY" } });
  await db.adminNotification.create({
    data: {
      type: "ticket",
      title: `پاسخ مشتری در تیکت #${ticket.number}`,
      href: `/admin/tickets/${ticket.id}`,
    },
  });
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { ok: true as const };
}

export async function closeTicket(ticketId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, message: "ابتدا وارد شوید." };
  await db.ticket.updateMany({
    where: { id: ticketId, userId: session.user.id },
    data: { status: "CLOSED" },
  });
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { ok: true as const };
}

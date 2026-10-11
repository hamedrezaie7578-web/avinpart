"use server";

import { db } from "@/lib/db";
import { sendTemplateSms } from "@/lib/sms";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

const STATUSES = ["OPEN", "ANSWERED", "CUSTOMER_REPLY", "CLOSED"] as const;
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export async function staffReply(ticketId: string, input: { body: string; attachmentIds: string[]; close: boolean }) {
  return adminAction("tickets.write", async (admin) => {
    const body = String(input.body ?? "").trim();
    if (body.length < 2) throw new ActionError("متن پاسخ خالی است.");
    if (body.length > 8000) throw new ActionError("متن پاسخ طولانی است.");
    const t = await db.ticket.findUnique({ where: { id: ticketId }, include: { user: true } });
    if (!t) throw new ActionError("تیکت یافت نشد.");
    const files = input.attachmentIds?.length
      ? await db.media.findMany({ where: { id: { in: input.attachmentIds.slice(0, 5) }, uploadedById: admin.id, path: { startsWith: "tickets/" }, ticketMessages: { none: {} } }, select: { id: true } })
      : [];
    await db.$transaction([
      db.ticketMessage.create({ data: { ticketId, authorId: admin.id, body, isStaff: true, attachments: { connect: files } } }),
      db.ticket.update({ where: { id: ticketId }, data: { status: input.close ? "CLOSED" : "ANSWERED" } }),
    ]);
    await audit(admin.id, "ticket.reply", "Ticket", ticketId);
    await sendTemplateSms("ticket_answered", t.user.mobile, { number: t.number });
    return { ok: true, message: "پاسخ ارسال شد." };
  });
}

export async function updateTicket(ticketId: string, f: FormData) {
  return adminAction("tickets.write", async (admin) => {
    const status = fd.str(f, "status");
    const priority = fd.str(f, "priority");
    const departmentId = fd.str(f, "departmentId");
    if (!(STATUSES as readonly string[]).includes(status) || !(PRIORITIES as readonly string[]).includes(priority)) throw new ActionError("مقدار نامعتبر.");
    const data = { status: status as (typeof STATUSES)[number], priority: priority as (typeof PRIORITIES)[number], departmentId };
    await db.ticket.update({ where: { id: ticketId }, data });
    await audit(admin.id, "ticket.update", "Ticket", ticketId, data);
    return { ok: true, message: "تیکت به‌روزرسانی شد." };
  });
}

export async function saveCannedReply(id: string | null, f: FormData) {
  return adminAction("tickets.write", async (admin) => {
    const data = { title: fd.str(f, "title", { required: "عنوان را وارد کنید." }), body: fd.str(f, "body", { required: "متن را وارد کنید.", max: 4000 }) };
    const c = id ? await db.cannedReply.update({ where: { id }, data }) : await db.cannedReply.create({ data });
    await audit(admin.id, "canned.save", "CannedReply", c.id);
    return { ok: true, message: "پاسخ آماده ذخیره شد." };
  });
}

export async function deleteCannedReply(id: string) {
  return adminAction("tickets.write", async (admin) => {
    await db.cannedReply.delete({ where: { id } });
    await audit(admin.id, "canned.delete", "CannedReply", id);
    return { ok: true, message: "حذف شد." };
  });
}

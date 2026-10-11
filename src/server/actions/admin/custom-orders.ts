"use server";

import { db } from "@/lib/db";
import { sendTemplateSms } from "@/lib/sms";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

const STATUSES = ["NEW", "REVIEWING", "QUOTE_SENT", "IN_DEVELOPMENT", "DELIVERED", "CANCELED"] as const;
type Status = (typeof STATUSES)[number];
const LABEL: Record<Status, string> = {
  NEW: "ثبت‌شده",
  REVIEWING: "در حال بررسی",
  QUOTE_SENT: "پیش‌فاکتور ارسال شد",
  IN_DEVELOPMENT: "در حال توسعه",
  DELIVERED: "تحویل‌شده",
  CANCELED: "لغوشده",
};

/** تغییر وضعیت + ثبت رویداد قابل مشاهده برای مشتری + پیامک */
async function changeStatus(adminId: string, id: string, status: Status, message: string | null, notify: boolean) {
  const o = await db.customOrder.findUnique({ where: { id } });
  if (!o) throw new ActionError("سفارش یافت نشد.");
  if (o.status === status && !message) return o;
  await db.$transaction([
    db.customOrder.update({ where: { id }, data: { status } }),
    db.customOrderEvent.create({ data: { orderId: id, status, message } }),
  ]);
  await audit(adminId, "customOrder.status", "CustomOrder", id, { from: o.status, to: status });
  if (notify && o.status !== status) await sendTemplateSms("custom_order_status", o.mobile, { trackingCode: o.trackingCode, status: LABEL[status] });
  return o;
}

/** جابه‌جایی کارت در کانبان (ستون و ترتیب) */
export async function moveCustomOrder(id: string, status: string, orderedIds: string[]) {
  return adminAction("customOrders.write", async (admin) => {
    if (!(STATUSES as readonly string[]).includes(status)) throw new ActionError("وضعیت نامعتبر.");
    await changeStatus(admin.id, id, status as Status, null, true);
    await db.$transaction(orderedIds.slice(0, 500).map((oid, i) => db.customOrder.updateMany({ where: { id: oid, status: status as Status }, data: { boardOrder: i } })));
    return { ok: true, message: `به «${LABEL[status as Status]}» منتقل شد.` };
  });
}

export async function updateCustomOrder(id: string, f: FormData) {
  return adminAction("customOrders.write", async (admin) => {
    const status = fd.str(f, "status") as Status;
    if (!STATUSES.includes(status)) throw new ActionError("وضعیت نامعتبر.");
    const assigneeId = fd.opt(f, "assigneeId");
    if (assigneeId && !(await db.user.findFirst({ where: { id: assigneeId, type: "ADMIN" } }))) throw new ActionError("کارشناس نامعتبر.");
    const quoteAmount = fd.int(f, "quoteAmount", { min: 0 });
    await db.customOrder.update({ where: { id }, data: { assigneeId, quoteAmount, quoteFileId: fd.opt(f, "quoteFileId") } });
    await changeStatus(admin.id, id, status, fd.opt(f, "eventMessage"), fd.bool(f, "notify"));
    await audit(admin.id, "customOrder.update", "CustomOrder", id, { assigneeId, quoteAmount });
    return { ok: true, message: "سفارش به‌روزرسانی شد." };
  });
}

export async function addCustomOrderNote(id: string, f: FormData) {
  return adminAction("customOrders.write", async (admin) => {
    const body = fd.str(f, "body", { required: "متن یادداشت را بنویسید.", max: 4000 });
    await db.customOrderNote.create({ data: { orderId: id, authorId: admin.id, body } });
    return { ok: true, message: "یادداشت ثبت شد." };
  });
}

import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

type Col = { header: string; key: string; width?: number };
type Exporter = { perm: string; title: string; columns: Col[]; rows: (sp: URLSearchParams) => Promise<Record<string, unknown>[]> };

const MAX = 20_000;
const date = (d: Date | null | undefined) => (d ? formatDateTime(d) : "");

/** فیلتر بازه‌ی تاریخ مشترک (from/to به فرمت YYYY-MM-DD) */
function range(sp: URLSearchParams) {
  const from = sp.get("from");
  const to = sp.get("to");
  if (!from && !to) return undefined;
  return { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}) };
}

const EXPORTERS: Record<string, Exporter> = {
  orders: {
    perm: "reports.export",
    title: "سفارش‌ها",
    columns: [
      { header: "شماره", key: "number", width: 10 }, { header: "مشتری", key: "customer", width: 22 }, { header: "موبایل", key: "mobile", width: 14 },
      { header: "نوع", key: "kind", width: 10 }, { header: "اقلام", key: "items", width: 40 }, { header: "جمع", key: "subtotal", width: 14 },
      { header: "تخفیف", key: "discount", width: 12 }, { header: "مالیات", key: "tax", width: 12 }, { header: "مبلغ کل (تومان)", key: "total", width: 16 },
      { header: "وضعیت", key: "status", width: 12 }, { header: "تاریخ ثبت", key: "createdAt", width: 20 }, { header: "تاریخ پرداخت", key: "paidAt", width: 20 },
    ],
    rows: async (sp) => {
      const status = sp.get("f_status");
      const r = await db.order.findMany({
        where: { ...(status ? { status: status as never } : {}), ...(range(sp) ? { createdAt: range(sp) } : {}) },
        include: { user: true, items: true },
        orderBy: { createdAt: "desc" },
        take: MAX,
      });
      return r.map((o) => ({ number: o.number, customer: o.user.name ?? "", mobile: o.user.mobile, kind: o.kind, items: o.items.map((i) => i.title).join("، "), subtotal: o.subtotal, discount: o.discount, tax: o.tax, total: o.total, status: o.status, createdAt: date(o.createdAt), paidAt: date(o.paidAt) }));
    },
  },
  customers: {
    perm: "customers.read",
    title: "مشتریان",
    columns: [
      { header: "نام", key: "name", width: 22 }, { header: "موبایل", key: "mobile", width: 14 }, { header: "ایمیل", key: "email", width: 24 },
      { header: "کسب‌وکار", key: "business", width: 24 }, { header: "شهر", key: "city", width: 12 }, { header: "تعداد سفارش", key: "orders", width: 12 },
      { header: "مسدود", key: "blocked", width: 8 }, { header: "تاریخ عضویت", key: "createdAt", width: 20 },
    ],
    rows: async () => {
      const r = await db.user.findMany({ where: { type: "CUSTOMER" }, include: { _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" }, take: MAX });
      return r.map((u) => ({ name: u.name ?? "", mobile: u.mobile, email: u.email ?? "", business: u.businessName ?? "", city: u.city ?? "", orders: u._count.orders, blocked: u.isBlocked ? "بله" : "", createdAt: date(u.createdAt) }));
    },
  },
  licenses: {
    perm: "licenses.read",
    title: "لایسنس‌ها",
    columns: [
      { header: "کلید", key: "key", width: 32 }, { header: "محصول", key: "product", width: 16 }, { header: "پلن", key: "plan", width: 16 },
      { header: "مشتری", key: "mobile", width: 14 }, { header: "وضعیت", key: "status", width: 10 }, { header: "دستگاه‌ها", key: "devices", width: 10 },
      { header: "انقضا", key: "expiresAt", width: 20 }, { header: "صدور", key: "createdAt", width: 20 },
    ],
    rows: async () => {
      const r = await db.license.findMany({ include: { product: true, plan: true, user: true, _count: { select: { devices: { where: { isActive: true } } } } }, orderBy: { createdAt: "desc" }, take: MAX });
      return r.map((l) => ({ key: l.key, product: l.product.name, plan: l.plan.name, mobile: l.user.mobile, status: l.status, devices: `${l._count.devices}/${l.maxDevices}`, expiresAt: date(l.expiresAt) || "دائمی", createdAt: date(l.createdAt) }));
    },
  },
  leads: {
    perm: "forms.read",
    title: "درخواست‌ها",
    columns: [
      { header: "نوع", key: "type", width: 12 }, { header: "نام", key: "name", width: 20 }, { header: "موبایل", key: "mobile", width: 14 },
      { header: "پیام", key: "message", width: 50 }, { header: "منبع", key: "source", width: 20 }, { header: "رسیدگی‌شده", key: "handled", width: 10 }, { header: "تاریخ", key: "createdAt", width: 20 },
    ],
    rows: async (sp) => {
      const type = sp.get("f_type");
      const r = await db.lead.findMany({ where: type ? { type: type as never } : {}, orderBy: { createdAt: "desc" }, take: MAX });
      return r.map((l) => ({ type: l.type, name: l.name ?? "", mobile: l.mobile ?? "", message: l.message ?? "", source: l.source ?? "", handled: l.isHandled ? "بله" : "", createdAt: date(l.createdAt) }));
    },
  },
  payments: {
    perm: "orders.read",
    title: "تراکنش‌ها",
    columns: [
      { header: "سفارش", key: "order", width: 10 }, { header: "درگاه", key: "gateway", width: 12 }, { header: "مبلغ (تومان)", key: "amount", width: 16 },
      { header: "وضعیت", key: "status", width: 12 }, { header: "کد پیگیری", key: "refId", width: 16 }, { header: "کارت", key: "card", width: 20 }, { header: "تاریخ", key: "createdAt", width: 20 },
    ],
    rows: async (sp) => {
      const r = await db.payment.findMany({ where: range(sp) ? { createdAt: range(sp) } : {}, include: { order: true }, orderBy: { createdAt: "desc" }, take: MAX });
      return r.map((p) => ({ order: p.order.number, gateway: p.gateway, amount: p.amount, status: p.status, refId: p.refId ?? "", card: p.cardPan ?? "", createdAt: date(p.createdAt) }));
    },
  },
};

/** خروجی Excel جدول‌های پنل مدیریت */
export async function GET(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  const ex = EXPORTERS[entity];
  if (!ex) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const session = await auth();
  if (session?.user?.type !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const u = await db.user.findUnique({ where: { id: session.user.id }, include: { role: true } });
  if (!hasPermission(u?.role?.permissions ?? [], ex.perm)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const wb = new ExcelJS.Workbook();
  wb.creator = "AvinApps";
  const ws = wb.addWorksheet(ex.title, { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
  ws.columns = ex.columns;
  ws.getRow(1).font = { bold: true };
  ws.addRows(await ex.rows(req.nextUrl.searchParams));
  await db.auditLog.create({ data: { userId: session.user.id, action: "export", entity } });
  const buf = await wb.xlsx.writeBuffer();
  const name = `avinapps-${entity}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}"` },
  });
}

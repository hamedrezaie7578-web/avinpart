import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { normalizeMobile, toEnDigits, toFaDigits } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

/** جست‌وجوی سراسری پنل (Ctrl+K) با رعایت مجوزهای کاربر */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.type !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const u = await db.user.findUnique({ where: { id: session.user.id }, include: { role: true } });
  const perms = u?.role?.permissions ?? [];
  const q = toEnDigits(req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ hits: [] });
  const can = (p: string) => hasPermission(perms, p);
  const mobile = normalizeMobile(q);
  const num = /^\d+$/.test(q) ? Number(q) : null;
  const hits: Array<{ type: string; label: string; sub?: string; href: string }> = [];

  const tasks: Promise<void>[] = [];
  if (can("customers.read"))
    tasks.push(
      db.user
        .findMany({ where: { type: "CUSTOMER", OR: [{ mobile: { contains: mobile ?? q } }, { name: { contains: q, mode: "insensitive" } }, { businessName: { contains: q, mode: "insensitive" } }] }, take: 5 })
        .then((r) => void hits.push(...r.map((x) => ({ type: "مشتری", label: x.name || toFaDigits(x.mobile), sub: x.businessName ?? toFaDigits(x.mobile), href: `/admin/customers/${x.id}` })))),
    );
  if (can("orders.read") && num && num < 2_000_000_000)
    tasks.push(db.order.findMany({ where: { number: num }, take: 3 }).then((r) => void hits.push(...r.map((o) => ({ type: "سفارش", label: `سفارش ${toFaDigits(o.number)}`, href: `/admin/orders/${o.id}` })))));
  if (can("licenses.read"))
    tasks.push(
      db.license
        .findMany({ where: { key: { contains: q.toUpperCase() } }, take: 5, include: { product: true } })
        .then((r) => void hits.push(...r.map((l) => ({ type: "لایسنس", label: l.key, sub: l.product.name, href: `/admin/licenses/${l.id}` })))),
    );
  if (can("products.read"))
    tasks.push(
      db.product
        .findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { industryName: { contains: q } }, { slug: { contains: q.toLowerCase() } }] }, take: 5 })
        .then((r) => void hits.push(...r.map((p) => ({ type: "محصول", label: p.name, sub: p.industryName, href: `/admin/products/${p.id}` })))),
    );
  if (can("customOrders.read"))
    tasks.push(
      db.customOrder
        .findMany({ where: { OR: [{ trackingCode: { contains: q.toUpperCase() } }, { contactName: { contains: q } }] }, take: 3 })
        .then((r) => void hits.push(...r.map((o) => ({ type: "سفارش اختصاصی", label: o.trackingCode, sub: o.contactName, href: `/admin/custom-orders/${o.id}` })))),
    );
  if (can("tickets.read") && num)
    tasks.push(db.ticket.findMany({ where: { number: num }, take: 3 }).then((r) => void hits.push(...r.map((t) => ({ type: "تیکت", label: `#${toFaDigits(t.number)} ${t.subject}`, href: `/admin/tickets/${t.id}` })))));
  await Promise.all(tasks);
  return NextResponse.json({ hits: hits.slice(0, 15) });
}

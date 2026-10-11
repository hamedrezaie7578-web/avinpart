import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function isAdmin() {
  const s = await auth();
  return s?.user?.type === "ADMIN";
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const [items, unread] = await Promise.all([
    db.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.adminNotification.count({ where: { readAt: null } }),
  ]);
  return NextResponse.json({ items, unread });
}

/** علامت‌گذاری همه به‌عنوان خوانده‌شده */
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await db.adminNotification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}

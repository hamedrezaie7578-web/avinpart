import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export type AdminUser = { id: string; name: string | null; mobile: string; permissions: string[] };

/**
 * محافظ صفحات پنل مدیریت. مجوزها هر بار از دیتابیس خوانده می‌شوند تا تغییر نقش
 * یا مسدودسازی فوراً اعمال شود (نه فقط پس از انقضای JWT).
 */
export async function requireAdmin(permission?: string): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user) redirect("/admin-login");
  const u = await db.user.findUnique({ where: { id: session.user.id }, include: { role: true } });
  if (!u || u.type !== "ADMIN" || u.isBlocked) redirect("/admin-login");
  const permissions = u.role?.permissions ?? [];
  if (permission && !hasPermission(permissions, permission)) redirect("/admin?denied=" + encodeURIComponent(permission));
  return { id: u.id, name: u.name, mobile: u.mobile, permissions };
}

export class ActionError extends Error {}

export type ActionResult<T = undefined> = { ok: true; message?: string; data?: T } | { ok: false; message: string };

/** اجرای امن Server Action مدیریتی با بررسی مجوز و مدیریت خطا */
export async function adminAction<T>(permission: string, fn: (admin: AdminUser) => Promise<ActionResult<T> | void>): Promise<ActionResult<T>> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "نشست شما منقضی شده است؛ دوباره وارد شوید." };
  const u = await db.user.findUnique({ where: { id: session.user.id }, include: { role: true } });
  if (!u || u.type !== "ADMIN" || u.isBlocked) return { ok: false, message: "دسترسی غیرمجاز." };
  const permissions = u.role?.permissions ?? [];
  if (!hasPermission(permissions, permission)) return { ok: false, message: "شما مجوز انجام این عملیات را ندارید." };
  try {
    return (await fn({ id: u.id, name: u.name, mobile: u.mobile, permissions })) ?? { ok: true, message: "ذخیره شد." };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, message: e.message };
    // خطای یکتا بودن Prisma
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") return { ok: false, message: "این مقدار تکراری است (باید یکتا باشد)." };
    console.error("[admin action]", e);
    return { ok: false, message: "خطای غیرمنتظره رخ داد." };
  }
}

/** ثبت لاگ فعالیت مدیران */
export async function audit(userId: string, action: string, entity: string, entityId?: string | null, diff?: unknown) {
  await db.auditLog.create({
    data: { userId, action, entity, entityId: entityId ?? null, diff: diff === undefined ? undefined : JSON.parse(JSON.stringify(diff)) },
  });
}

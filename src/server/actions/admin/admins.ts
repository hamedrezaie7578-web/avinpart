"use server";

import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { normalizeMobile } from "@/lib/format";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "رمز عبور حداقل ۱۰ کاراکتر باشد.";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "رمز عبور باید شامل حرف و عدد باشد.";
  return null;
}

export async function saveRole(id: string | null, f: FormData) {
  return adminAction("admins.write", async (admin) => {
    const existing = id ? await db.role.findUnique({ where: { id } }) : null;
    if (existing?.isSystem) throw new ActionError("نقش «مدیر کل» قابل ویرایش نیست.");
    const permissions = fd.arr(f, "permissions").filter((p) => ALL_PERMISSIONS.includes(p));
    const data = { name: fd.str(f, "name", { required: "نام نقش را وارد کنید.", max: 60 }), description: fd.opt(f, "description"), permissions };
    const r = id ? await db.role.update({ where: { id }, data }) : await db.role.create({ data });
    await audit(admin.id, id ? "role.update" : "role.create", "Role", r.id, data);
    return { ok: true, message: "نقش ذخیره شد." };
  });
}

export async function deleteRole(id: string) {
  return adminAction("admins.write", async (admin) => {
    const r = await db.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!r) throw new ActionError("یافت نشد.");
    if (r.isSystem) throw new ActionError("نقش سیستمی قابل حذف نیست.");
    if (r._count.users) throw new ActionError("ابتدا نقش مدیرانِ دارای این نقش را تغییر دهید.");
    await db.role.delete({ where: { id } });
    await audit(admin.id, "role.delete", "Role", id);
    return { ok: true, message: "نقش حذف شد." };
  });
}

/** آیا پس از این تغییر هنوز حداقل یک مدیر کل فعال باقی می‌ماند؟ */
async function ensureSuperAdminLeft(excludeUserId: string) {
  const left = await db.user.count({ where: { type: "ADMIN", isBlocked: false, id: { not: excludeUserId }, role: { isSystem: true } } });
  if (!left) throw new ActionError("حداقل یک «مدیر کل» فعال باید باقی بماند.");
}

export async function saveAdmin(id: string | null, f: FormData) {
  return adminAction("admins.write", async (admin) => {
    const mobile = normalizeMobile(fd.str(f, "mobile"));
    if (!mobile) throw new ActionError("شماره موبایل نامعتبر است.");
    const roleId = fd.str(f, "roleId", { required: "نقش را انتخاب کنید." });
    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) throw new ActionError("نقش نامعتبر است.");
    const isBlocked = fd.bool(f, "isBlocked");
    const password = fd.str(f, "password");
    if (!id && !password) throw new ActionError("برای مدیر جدید رمز عبور تعیین کنید.");
    if (password) {
      const p = passwordProblem(password);
      if (p) throw new ActionError(p);
    }
    if (id) {
      const current = await db.user.findUnique({ where: { id }, include: { role: true } });
      if (!current || current.type !== "ADMIN") throw new ActionError("مدیر یافت نشد.");
      if (current.role?.isSystem && (!role.isSystem || isBlocked)) await ensureSuperAdminLeft(id);
      if (id === admin.id && isBlocked) throw new ActionError("نمی‌توانید حساب خودتان را مسدود کنید.");
    } else if (await db.user.findUnique({ where: { mobile } })) {
      throw new ActionError("این شماره قبلاً ثبت شده است (اگر مشتری است، ابتدا از بخش مشتریان بررسی کنید).");
    }
    const data = {
      name: fd.str(f, "name", { required: "نام را وارد کنید." }),
      mobile,
      email: fd.opt(f, "email"),
      roleId,
      isBlocked,
      ...(password ? { passwordHash: await hash(password) } : {}),
    };
    const u = id ? await db.user.update({ where: { id }, data }) : await db.user.create({ data: { ...data, type: "ADMIN" } });
    await audit(admin.id, id ? "admin.update" : "admin.create", "User", u.id, { name: data.name, mobile, roleId, isBlocked, passwordChanged: !!password });
    return { ok: true, message: "مدیر ذخیره شد." };
  });
}

export async function resetAdmin2fa(id: string) {
  return adminAction("admins.write", async (admin) => {
    await db.user.update({ where: { id }, data: { totpEnabled: false, totpSecret: null } });
    await audit(admin.id, "admin.2fa.reset", "User", id);
    return { ok: true, message: "ورود دومرحله‌ای این مدیر غیرفعال شد." };
  });
}

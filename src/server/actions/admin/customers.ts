"use server";

import { db } from "@/lib/db";
import { adminAction, audit } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

export async function setCustomerBlocked(userId: string, blocked: boolean) {
  return adminAction("customers.block", async (admin) => {
    await db.user.update({ where: { id: userId, type: "CUSTOMER" }, data: { isBlocked: blocked } });
    await audit(admin.id, blocked ? "customer.block" : "customer.unblock", "User", userId);
    return { ok: true, message: blocked ? "کاربر مسدود شد." : "کاربر از حالت مسدود خارج شد." };
  });
}

export async function updateCustomer(userId: string, f: FormData) {
  return adminAction("customers.write", async (admin) => {
    const data = {
      name: fd.opt(f, "name"),
      email: fd.opt(f, "email")?.toLowerCase() ?? null,
      businessName: fd.opt(f, "businessName"),
      nationalId: fd.opt(f, "nationalId"),
      economicCode: fd.opt(f, "economicCode"),
      city: fd.opt(f, "city"),
      address: fd.opt(f, "address"),
    };
    await db.user.update({ where: { id: userId }, data });
    await audit(admin.id, "customer.update", "User", userId, data);
  });
}

"use server";

import { unlink } from "node:fs/promises";
import { db } from "@/lib/db";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { backupPath, createBackup } from "@/server/backup";

export async function runBackup() {
  return adminAction("audit.backup", async (admin) => {
    try {
      const b = await createBackup();
      await audit(admin.id, "backup.create", "Backup", b.id, { file: b.file, size: b.size });
      return { ok: true, message: "پشتیبان‌گیری انجام شد." };
    } catch (e) {
      console.error("[backup]", e);
      throw new ActionError("پشتیبان‌گیری ناموفق بود؛ نصب بودن pg_dump و دسترسی پوشه‌ی پشتیبان را بررسی کنید.");
    }
  });
}

export async function deleteBackup(id: string) {
  return adminAction("audit.backup", async (admin) => {
    const b = await db.backup.findUnique({ where: { id } });
    if (!b) throw new ActionError("یافت نشد.");
    await unlink(backupPath(b.file)).catch(() => {});
    await db.backup.delete({ where: { id } });
    await audit(admin.id, "backup.delete", "Backup", id, { file: b.file });
    return { ok: true, message: "حذف شد." };
  });
}

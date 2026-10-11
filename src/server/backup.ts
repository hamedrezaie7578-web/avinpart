import "server-only";
import { spawn } from "node:child_process";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

export const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || "./storage/backups");
const KEEP = Number(process.env.BACKUP_KEEP || 14);

/** آدرس اتصال بدون پارامترهای مخصوص Prisma (pg_dump آن‌ها را نمی‌شناسد) */
function pgUrl() {
  const u = new URL(process.env.DATABASE_URL ?? "");
  u.searchParams.delete("schema");
  u.searchParams.delete("connection_limit");
  u.searchParams.delete("pool_timeout");
  return u.toString();
}

/** پشتیبان کامل با pg_dump (فرمت custom فشرده) + حذف نسخه‌های قدیمی‌تر از KEEP */
export async function createBackup(): Promise<{ id: string; file: string; size: number }> {
  await mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = `avinapps-${stamp}.dump`;
  const full = path.join(BACKUP_DIR, file);
  await new Promise<void>((resolve, reject) => {
    const p = spawn("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", `--file=${full}`, `--dbname=${pgUrl()}`], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d: Buffer) => (err += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`pg_dump exited ${code}: ${err.slice(0, 500)}`))));
  });
  const { size } = await stat(full);
  const b = await db.backup.create({ data: { file, size } });
  const old = await db.backup.findMany({ orderBy: { createdAt: "desc" }, skip: KEEP });
  for (const o of old) {
    await unlink(path.join(BACKUP_DIR, o.file)).catch(() => {});
    await db.backup.delete({ where: { id: o.id } });
  }
  return { id: b.id, file, size };
}

/** مسیر امن فایل پشتیبان (جلوگیری از path traversal) */
export function backupPath(file: string) {
  if (!/^avinapps-[\dT-]+\.dump$/.test(file)) throw new Error("invalid backup file");
  return path.join(BACKUP_DIR, file);
}

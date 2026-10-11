import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { audit } from "@/server/admin/guard";
import { backupPath } from "@/server/backup";

/** دانلود فایل پشتیبان (فقط مدیران با مجوز audit.backup) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.type !== "ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { id: session.user.id }, include: { role: true } });
  if (!u || u.isBlocked || !hasPermission(u.role?.permissions, "audit.backup")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const b = await db.backup.findUnique({ where: { id } });
  if (!b) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const file = backupPath(b.file);
  const { size } = await stat(file).catch(() => ({ size: -1 }));
  if (size < 0) return NextResponse.json({ error: "file_missing" }, { status: 404 });
  await audit(u.id, "backup.download", "Backup", id);
  return new NextResponse(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: { "Content-Type": "application/octet-stream", "Content-Length": String(size), "Content-Disposition": `attachment; filename="${b.file}"`, "Cache-Control": "no-store" },
  });
}

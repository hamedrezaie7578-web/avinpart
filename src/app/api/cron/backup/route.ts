import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createBackup } from "@/server/backup";

/**
 * پشتیبان‌گیری زمان‌بندی‌شده: کانتینر cron (یا crontab سرور) روزانه این آدرس را با
 * هدر Authorization: Bearer $CRON_SECRET فراخوانی می‌کند.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await createBackup();
    return NextResponse.json({ ok: true, file: b.file, size: b.size });
  } catch (e) {
    console.error("[cron backup]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendTemplateSms } from "@/lib/sms";
import { isCronAuthorized } from "@/server/cron-auth";

const DAY = 864e5;
const REMIND_DAYS = [14, 3];

/**
 * کارهای روزانه (فراخوانی توسط سرویس cron در docker-compose):
 * - پیامک یادآوری تمدید سرویس ابری ۱۴ و ۳ روز مانده به پایان
 * - اعلان مدیر برای سرویس‌های منقضی‌شده‌ی دیروز
 * - پاک‌سازی کدهای OTP و رکوردهای محدودیت نرخ قدیمی
 */
export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = Date.now();
  let reminders = 0;
  for (const d of REMIND_DAYS) {
    const licenses = await db.license.findMany({
      where: { status: "ACTIVE", expiresAt: { gte: new Date(now + d * DAY), lt: new Date(now + (d + 1) * DAY) } },
      include: { user: { select: { name: true, mobile: true } }, product: { select: { name: true } } },
    });
    for (const l of licenses) {
      if (await sendTemplateSms("license_expiring", l.user.mobile, { name: l.user.name ?? "مشتری", product: l.product.name, days: d })) reminders++;
    }
  }
  const expired = await db.license.count({ where: { status: "ACTIVE", expiresAt: { gte: new Date(now - DAY), lt: new Date(now) } } });
  if (expired) await db.adminNotification.create({ data: { type: "license", title: `${expired.toLocaleString("fa-IR")} سرویس ابری دیروز منقضی شد`, href: "/admin/licenses" } });
  const [otp, rl] = await Promise.all([
    db.otpCode.deleteMany({ where: { createdAt: { lt: new Date(now - 7 * DAY) } } }),
    db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(now) } } }),
  ]);
  return NextResponse.json({ ok: true, reminders, expired, cleaned: { otp: otp.count, rateLimit: rl.count } });
}

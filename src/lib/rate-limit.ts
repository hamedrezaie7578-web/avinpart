import "server-only";
import { db } from "@/lib/db";

/**
 * محدودسازی نرخ با جدول RateLimit در Postgres (پنجره‌ی ثابت).
 * بدون نیاز به Redis؛ برای حجم ترافیک این سایت کافی است.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  // upsert اتمیک: اگر پنجره تمام شده، شمارنده ریست می‌شود
  const rows = await db.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const row = rows[0]!;
  return {
    ok: row.count <= limit,
    retryAfter: Math.max(0, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

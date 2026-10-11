import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { verifyAndActivate } from "@/server/licenses";

const schema = z.object({
  key: z.string().min(10).max(40),
  hardwareId: z.string().min(8).max(256),
  platform: z.enum(["WINDOWS", "ANDROID", "WEB", "IOS"]),
  deviceName: z.string().max(100).optional(),
  appVersion: z.string().max(30).optional(),
});

/**
 * POST /api/license/verify
 * بدنه: { key, hardwareId, platform, deviceName?, appVersion? }
 * پاسخ: { payload, signature } — امضای Ed25519 روی JSON کانونیکال payload
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (!(await rateLimit(`lic:ip:${ip}`, 60, 60)).ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!(await rateLimit(`lic:key:${parsed.data.key}`, 30, 60)).ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const r = await verifyAndActivate({ ...parsed.data, ip });
  return NextResponse.json(r.body, { status: r.status, headers: { "Cache-Control": "no-store" } });
}

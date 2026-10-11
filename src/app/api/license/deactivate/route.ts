import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { deactivateDevice } from "@/server/licenses";

/** POST /api/license/deactivate — آزادسازی ظرفیت دستگاه (مثلاً هنگام حذف برنامه) */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (!(await rateLimit(`lic:deact:${ip}`, 20, 60)).ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = z
    .object({ key: z.string().min(10).max(40), hardwareId: z.string().min(8).max(256) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const ok = await deactivateDevice(parsed.data.key, parsed.data.hardwareId, ip);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}

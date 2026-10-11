import { NextResponse, type NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/** پیکربندی سبک برای middleware: ریدایرکت‌ها و وضعیت حالت تعمیر (هر دو عمومی‌اند) */
const load = unstable_cache(
  async () => {
    const [redirects, m] = await Promise.all([
      db.redirect.findMany({ select: { from: true, to: true, code: true } }),
      db.setting.findUnique({ where: { key: "site.maintenance" } }),
    ]);
    return { redirects, maintenance: m?.value === true };
  },
  ["edge-config"],
  { tags: ["settings", "redirects"], revalidate: 300 },
);

export async function GET() {
  return NextResponse.json(await load(), { headers: { "Cache-Control": "no-store" } });
}

/** شمارش استفاده از ریدایرکت (fire-and-forget از middleware) */
export async function POST(req: NextRequest) {
  if (req.headers.get("x-edge-config") !== (process.env.AUTH_SECRET ?? "").slice(0, 16)) return new NextResponse(null, { status: 403 });
  const from = req.nextUrl.searchParams.get("hit");
  if (from) await db.redirect.updateMany({ where: { from }, data: { hits: { increment: 1 } } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}

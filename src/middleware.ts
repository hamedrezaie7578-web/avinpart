import NextAuth from "next-auth";
import { NextResponse, type NextFetchEvent } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

type EdgeConfig = { redirects: Array<{ from: string; to: string; code: number }>; maintenance: boolean };
let cached: { at: number; data: EdgeConfig } | null = null;

/** آدرس داخلی سرور (در standalone آدرس درخواست ممکن است 0.0.0.0 باشد) */
const internal = () => `http://127.0.0.1:${process.env.PORT || 3000}`;

async function edgeConfig(): Promise<EdgeConfig> {
  if (cached && Date.now() - cached.at < 60_000) return cached.data;
  try {
    const r = await fetch(`${internal()}/api/edge-config`, { cache: "no-store", signal: AbortSignal.timeout(1500) });
    if (r.ok) cached = { at: Date.now(), data: (await r.json()) as EdgeConfig };
  } catch {
    // در صورت خطا، سایت بدون ریدایرکت/حالت تعمیر ادامه می‌دهد
  }
  return cached?.data ?? { redirects: [], maintenance: false };
}

const MAINTENANCE_ALLOWED = /^\/(admin|admin-login|api|maintenance|media|_next)(\/|$)/;

/**
 * - محافظت از /dashboard (کاربر واردشده) و /admin (فقط مدیران)
 * - ریدایرکت‌های ۳۰۱/۳۰۲ تعریف‌شده در پنل سئو
 * - حالت تعمیر: بازدیدکنندگان (غیر از مدیران) به صفحه‌ی تعمیر هدایت می‌شوند
 */
export default auth(async (req, ev: NextFetchEvent) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;
  const under = (p: string) => pathname === p || pathname.startsWith(`${p}/`);

  if (under("/dashboard") && !user) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }
  if (under("/admin")) {
    if (!user) {
      const url = new URL("/admin-login", req.nextUrl);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    if (user.type !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    return NextResponse.next();
  }
  if (under("/api") || under("/dashboard")) return NextResponse.next();

  const cfg = await edgeConfig();
  const path = decodeURIComponent(pathname).replace(/\/+$/, "") || "/";
  const hit = cfg.redirects.find((r) => r.from === path);
  if (hit) {
    ev.waitUntil(
      fetch(`${internal()}/api/edge-config?hit=${encodeURIComponent(hit.from)}`, { method: "POST", headers: { "x-edge-config": (process.env.AUTH_SECRET ?? "").slice(0, 16) } }).catch(() => {}),
    );
    const dest = /^https?:\/\//.test(hit.to) ? hit.to : new URL(hit.to, req.nextUrl).toString();
    return NextResponse.redirect(dest, hit.code === 302 ? 302 : 301);
  }
  if (cfg.maintenance && user?.type !== "ADMIN" && !MAINTENANCE_ALLOWED.test(pathname)) {
    return NextResponse.rewrite(new URL("/maintenance", req.nextUrl), { status: 503, headers: { "Retry-After": "3600" } });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|fonts/|favicon|icon\\.svg|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$).*)"],
};

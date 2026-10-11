import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

/** محافظت از مسیرهای /dashboard (هر کاربر واردشده) و /admin (فقط مدیران) */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname.startsWith("/dashboard") && !user) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = new URL("/admin-login", req.nextUrl);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    if (user.type !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };

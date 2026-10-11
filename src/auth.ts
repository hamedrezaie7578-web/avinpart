import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify as verifyPassword } from "@node-rs/argon2";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { normalizeMobile } from "@/lib/format";
import { verifyOtp } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { mergeGuestCart } from "@/server/cart";

class OtpError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

async function toSessionUser(userId: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { role: true } });
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    type: u.type,
    mobile: u.mobile,
    permissions: u.type === "ADMIN" ? (u.role?.permissions ?? []) : [],
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    /** ورود مشتریان با موبایل و کد یکبارمصرف؛ کاربر جدید خودکار ساخته می‌شود */
    Credentials({
      id: "otp",
      credentials: { mobile: {}, code: {} },
      async authorize(raw) {
        const parsed = z
          .object({ mobile: z.string(), code: z.string().regex(/^\d{4,6}$/) })
          .safeParse(raw);
        const mobile = parsed.success ? normalizeMobile(parsed.data.mobile) : null;
        if (!parsed.success || !mobile) throw new OtpError("invalid");

        const result = await verifyOtp(mobile, parsed.data.code);
        if (result !== "ok") throw new OtpError(result);

        let user = await db.user.findUnique({ where: { mobile } });
        if (user?.isBlocked) throw new OtpError("blocked");
        if (!user) {
          user = await db.user.create({ data: { mobile } });
          // سفارش‌های اختصاصی که قبل از ثبت‌نام با همین موبایل ثبت شده‌اند به حساب متصل می‌شوند
          await db.customOrder.updateMany({
            where: { mobile, userId: null },
            data: { userId: user.id },
          });
        }
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await mergeGuestCart(user.id);
        return toSessionUser(user.id);
      },
    }),
    /** ورود مدیران با موبایل یا ایمیل و رمز عبور */
    Credentials({
      id: "admin",
      credentials: { identifier: {}, password: {} },
      async authorize(raw) {
        const parsed = z
          .object({ identifier: z.string().min(3).max(120), password: z.string().min(6).max(200) })
          .safeParse(raw);
        if (!parsed.success) return null;
        const id = parsed.data.identifier.trim().toLowerCase();
        if (!(await rateLimit(`admin-login:${id}`, 5, 900)).ok) throw new OtpError("too_many");

        const mobile = normalizeMobile(id);
        const user = await db.user.findFirst({ where: mobile ? { mobile } : { email: id } });
        if (!user || user.type !== "ADMIN" || !user.passwordHash || user.isBlocked) return null;
        if (!(await verifyPassword(user.passwordHash, parsed.data.password))) return null;

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await db.auditLog.create({
          data: { userId: user.id, action: "auth.login", entity: "User", entityId: user.id },
        });
        return toSessionUser(user.id);
      },
    }),
  ],
});

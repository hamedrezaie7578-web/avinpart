import type { NextAuthConfig } from "next-auth";

/**
 * بخش edge-safe پیکربندی Auth.js (بدون Prisma) که middleware از آن استفاده می‌کند.
 * Providerها در src/auth.ts اضافه می‌شوند.
 */
export const authConfig = {
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 3600 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id!;
        token.type = user.type;
        token.mobile = user.mobile;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid;
      session.user.type = token.type;
      session.user.mobile = token.mobile;
      session.user.permissions = token.permissions;
      return session;
    },
  },
} satisfies NextAuthConfig;

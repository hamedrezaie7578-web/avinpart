import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** کاربر جاری برای صفحات پنل؛ در صورت عدم ورود به صفحه‌ی ورود هدایت می‌شود */
export async function requireCustomer(callbackUrl = "/dashboard") {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.isBlocked) redirect("/login");
  return user;
}

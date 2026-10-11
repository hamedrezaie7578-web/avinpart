import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OtpLoginForm } from "@/components/forms/otp-login-form";

export const metadata: Metadata = { title: "ورود / ثبت‌نام", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  if (session?.user)
    redirect(
      callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard",
    );
  return (
    <>
      <h1 className="text-2xl font-black">ورود یا ثبت‌نام</h1>
      <p className="text-muted-foreground mt-2 mb-8 leading-7">
        شماره موبایل خود را وارد کنید؛ اگر حساب ندارید، به‌صورت خودکار ساخته می‌شود.
      </p>
      <OtpLoginForm callbackUrl={callbackUrl} />
    </>
  );
}

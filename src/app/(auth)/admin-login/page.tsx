import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/forms/admin-login-form";

export const metadata: Metadata = { title: "ورود مدیران", robots: { index: false, follow: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <>
      <ShieldCheck className="text-primary size-10" aria-hidden />
      <h1 className="mt-3 text-2xl font-black">ورود به پنل مدیریت</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        این بخش فقط برای مدیران و کارکنان AvinApps است.
      </p>
      <AdminLoginForm callbackUrl={callbackUrl} />
    </>
  );
}

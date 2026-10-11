import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/design-system/theme-toggle";
import { DashboardNav } from "@/components/dashboard/nav";
import { Button } from "@/components/ui/button";
import { logout } from "@/server/actions/auth";
import { requireCustomer } from "@/server/session";
import { toFaDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: { default: "پنل کاربری", template: "%s | پنل کاربری AvinApps" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();
  return (
    <div className="bg-muted/30 min-h-dvh print:bg-white">
      <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur print:hidden">
        <div className="container-x flex h-16 items-center gap-3">
          <Logo />
          <div className="ms-auto flex items-center gap-1">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/">بازگشت به سایت</Link>
            </Button>
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="icon" aria-label="خروج از حساب">
                <LogOut className="size-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="container-x grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:py-8 print:block print:p-0">
        <aside className="lg:sticky lg:top-24 lg:h-fit print:hidden">
          <div className="bg-card mb-4 hidden rounded-2xl border p-4 lg:block">
            <p className="font-bold">{user.name || "کاربر گرامی"}</p>
            <p
              className="text-muted-foreground mt-1 text-sm"
              dir="ltr"
              style={{ textAlign: "right" }}
            >
              {toFaDigits(user.mobile)}
            </p>
            {user.businessName && (
              <p className="text-muted-foreground mt-1 text-sm">{user.businessName}</p>
            )}
          </div>
          <div className="bg-card rounded-2xl border p-2">
            <DashboardNav />
          </div>
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

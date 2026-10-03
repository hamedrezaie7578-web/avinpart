import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Lock, Monitor, Smartphone } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { EmptyState } from "@/components/design-system/empty-state";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "دانلود نرم‌افزار حسابداری؛ نسخه‌ی دموی رایگان ویندوز و اندروید",
  description:
    "دانلود نسخه‌ی دموی رایگان نرم‌افزارهای حسابداری Avin برای ویندوز و اندروید. دارندگان لایسنس، نسخه‌ی کامل را از پنل کاربری دریافت می‌کنند.",
  alternates: { canonical: "/download" },
};

const ICON = { WINDOWS: Monitor, ANDROID: Smartphone, WEB: Globe, IOS: Smartphone } as const;
const LABEL = { WINDOWS: "ویندوز", ANDROID: "اندروید", WEB: "تحت وب", IOS: "iOS" } as const;

export default async function DownloadPage() {
  const demos = await db.release.findMany({
    where: { isDemo: true, isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  });
  return (
    <>
      <PageHero
        crumbs={[{ name: "دانلود", href: "/download" }]}
        title="دانلود نرم‌افزارهای Avin"
        description="نسخه‌ی دموی رایگان را نصب کنید و همه‌ی امکانات را با داده‌های نمونه امتحان کنید. اگر لایسنس دارید، نسخه‌ی کامل و آخرین به‌روزرسانی‌ها در پنل کاربری شماست."
      />
      <Section>
        <div className="bg-accent/50 mb-10 flex flex-col items-center justify-between gap-4 rounded-2xl border p-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <Lock className="text-primary size-6" aria-hidden />
            <p className="font-medium">
              دارنده‌ی لایسنس هستید؟ نسخه‌ی کامل و لینک ورود به نسخه‌ی وب را از پنل کاربری دریافت
              کنید.
            </p>
          </div>
          <Button asChild className="h-11 rounded-xl px-6 font-bold">
            <Link href="/dashboard/downloads">ورود به پنل کاربری</Link>
          </Button>
        </div>
        <SectionHeader title="نسخه‌های دموی رایگان" align="start" />
        {demos.length ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {demos.map((r) => {
              const I = ICON[r.platform];
              return (
                <li key={r.id} className="bg-card flex flex-col rounded-2xl border p-6">
                  <I className="text-primary size-8" aria-hidden />
                  <h3 className="mt-3 font-extrabold">
                    {r.product?.name ?? "AvinApps"} — {LABEL[r.platform]}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm" dir="ltr">
                    v{r.version} · {formatDate(r.createdAt)}
                  </p>
                  <Button asChild variant="outline" className="mt-5 h-11 rounded-xl font-bold">
                    <a href={`/api/download/${r.id}`}>دانلود دمو</a>
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon="Monitor"
            title="نسخه‌ی دمو به‌زودی در این صفحه قرار می‌گیرد"
            description="تا آن زمان، دموی آنلاین با کارشناس بگیرید؛ نرم‌افزار مخصوص صنف شما را زنده و با داده‌های واقعی نشانتان می‌دهیم."
            action={
              <Button asChild className="h-11 rounded-xl font-bold">
                <Link href="/contact#demo">درخواست دموی آنلاین</Link>
              </Button>
            }
          />
        )}
      </Section>
    </>
  );
}

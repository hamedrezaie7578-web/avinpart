import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  FileQuestion,
  Headphones,
  LifeBuoy,
  MonitorSmartphone,
  Ticket,
} from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { getSettings, telHref } from "@/server/queries/settings";
import { toFaDigits } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "پشتیبانی نرم‌افزار؛ تیکت، تماس تلفنی و اتصال از راه دور",
  description:
    "پشتیبانی نرم‌افزارهای حسابداری Avin: ثبت تیکت، تماس با پشتیبانی، دانلود آخرین نسخه، راهنمای اتصال از راه دور و سؤالات متداول.",
  alternates: { canonical: "/support" },
};

export default async function SupportPage() {
  const s = await getSettings();
  const cards = [
    {
      Icon: Ticket,
      title: "ثبت تیکت پشتیبانی",
      text: "سریع‌ترین راه پیگیری مشکل؛ با امکان پیوست تصویر و پیگیری وضعیت در پنل کاربری.",
      href: "/dashboard/tickets",
      cta: "ورود و ثبت تیکت",
    },
    {
      Icon: Headphones,
      title: "تماس تلفنی",
      text: `کارشناسان پشتیبانی در ساعات کاری (${s.workingHours}) پاسخ‌گوی شما هستند.`,
      href: s.phone ? telHref(s.phone) : "/contact",
      cta: s.phone || "اطلاعات تماس",
    },
    {
      Icon: Download,
      title: "دانلود آخرین نسخه",
      text: "نسخه‌ی جدید ویندوز و اندروید را دریافت کنید؛ به‌روزرسانی‌ها شامل آخرین تغییرات سامانه‌ی مودیان است.",
      href: "/download",
      cta: "صفحه‌ی دانلود",
    },
    {
      Icon: FileQuestion,
      title: "سؤالات متداول",
      text: "پاسخ سؤالات رایج درباره‌ی لایسنس، انتقال به سیستم جدید، پشتیبان‌گیری و ارتقا.",
      href: "/faq",
      cta: "مشاهده‌ی سؤالات",
    },
  ];
  return (
    <>
      <PageHero
        crumbs={[{ name: "پشتیبانی", href: "/support" }]}
        eyebrow="ما کنار شما هستیم"
        title="پشتیبانی AvinApps"
        description="نصب، انتقال اطلاعات، آموزش و رفع مشکل؛ تیم پشتیبانی واقعی که کسب‌وکار شما را می‌شناسد و تلفن را جواب می‌دهد."
      />
      <Section>
        <div className="grid gap-6 sm:grid-cols-2">
          {cards.map(({ Icon, title, text, href, cta }) => (
            <article key={title} className="bg-card flex flex-col rounded-3xl border p-7">
              <Icon className="text-primary size-9" aria-hidden />
              <h2 className="mt-4 text-xl font-extrabold">{title}</h2>
              <p className="text-muted-foreground mt-2 flex-1 leading-8">{text}</p>
              <Link href={href} className="text-primary mt-5 font-bold hover:underline">
                {cta}
              </Link>
            </article>
          ))}
        </div>
      </Section>
      <Section muted aria-labelledby="remote-title">
        <SectionHeader
          id="remote-title"
          eyebrow="اتصال از راه دور"
          title="کارشناس ما چطور به سیستم شما وصل می‌شود؟"
        />
        <ol className="mx-auto max-w-3xl space-y-4">
          {[
            [
              "نرم‌افزار AnyDesk را نصب کنید",
              "این نرم‌افزار رایگان را از سایت رسمی آن دریافت و اجرا کنید.",
            ],
            [
              "شناسه را برای ما بفرستید",
              "شناسه‌ی ۹ یا ۱۰ رقمی نمایش‌داده‌شده را در تیکت یا تماس تلفنی اعلام کنید.",
            ],
            [
              "اتصال را تأیید کنید",
              "پس از درخواست کارشناس، دکمه‌ی Accept را بزنید. هر زمان بخواهید می‌توانید اتصال را قطع کنید.",
            ],
          ].map(([t, d], i) => (
            <li key={t} className="bg-card flex gap-4 rounded-2xl border p-5">
              <MonitorSmartphone className="text-primary mt-1 size-6 shrink-0" aria-hidden />
              <div>
                <p className="font-bold">
                  {toFaDigits(i + 1)}. {t}
                </p>
                <p className="text-muted-foreground mt-1 leading-7">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground mt-8 flex items-center justify-center gap-2 text-sm">
          <LifeBuoy className="size-4" aria-hidden />
          کارشناسان AvinApps هرگز رمز عبور یا اطلاعات بانکی شما را درخواست نمی‌کنند.
        </p>
      </Section>
    </>
  );
}

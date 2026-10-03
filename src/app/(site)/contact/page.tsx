import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { JsonLd } from "@/components/design-system/json-ld";
import { ContactForm } from "@/components/forms/contact-form";
import { DemoRequestForm } from "@/components/sections/demo-request-form";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { getSettings, telHref } from "@/server/queries/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "تماس با ما؛ مشاوره‌ی خرید، پشتیبانی و درخواست دمو",
  description:
    "راه‌های ارتباط با AvinApps: تلفن، ایمیل، آدرس و فرم تماس. درخواست دموی رایگان نرم‌افزار حسابداری و مشاوره‌ی خرید.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const map = await db.setting.findUnique({ where: { key: "contact.map" } });
  const loc = (map?.value as { lat?: number; lng?: number } | null) ?? null;
  const items = [
    s.phone && { Icon: Phone, label: "تلفن", value: s.phone, href: telHref(s.phone) },
    s.mobile && {
      Icon: Phone,
      label: "موبایل / واتس‌اپ",
      value: s.mobile,
      href: telHref(s.mobile),
    },
    s.email && { Icon: Mail, label: "ایمیل", value: s.email, href: `mailto:${s.email}` },
    s.address && { Icon: MapPin, label: "آدرس", value: s.address },
    s.workingHours && { Icon: Clock, label: "ساعات کاری", value: s.workingHours },
  ].filter(Boolean) as Array<{ Icon: typeof Phone; label: string; value: string; href?: string }>;

  return (
    <>
      <PageHero
        crumbs={[{ name: "تماس با ما", href: "/contact" }]}
        title="با ما در تماس باشید"
        description="برای مشاوره‌ی خرید، پشتیبانی فنی یا سفارش نرم‌افزار اختصاصی، از هر راهی که برایتان راحت‌تر است با ما ارتباط بگیرید. معمولاً در همان روز کاری پاسخ می‌دهیم."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            {items.map(({ Icon, label, value, href }) => (
              <div key={label} className="bg-card flex items-start gap-4 rounded-2xl border p-5">
                <span className="bg-accent text-accent-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-muted-foreground text-sm">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      className="hover:text-primary mt-0.5 block font-bold"
                      dir={label === "ایمیل" ? "ltr" : undefined}
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="mt-0.5 leading-7 font-bold">{value}</p>
                  )}
                </div>
              </div>
            ))}
            {loc?.lat && loc?.lng && (
              <div className="overflow-hidden rounded-2xl border">
                <iframe
                  title="موقعیت دفتر AvinApps روی نقشه"
                  loading="lazy"
                  className="h-64 w-full"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.01}%2C${loc.lat - 0.006}%2C${loc.lng + 0.01}%2C${loc.lat + 0.006}&layer=mapnik&marker=${loc.lat}%2C${loc.lng}`}
                />
              </div>
            )}
          </div>
          <ContactForm />
        </div>
      </Section>
      <Section id="demo" muted aria-labelledby="demo-title">
        <SectionHeader
          id="demo-title"
          eyebrow="دموی رایگان"
          title="نرم‌افزار را قبل از خرید، زنده ببینید"
          description="شماره‌تان را بگذارید تا کارشناس ما زمان یک دموی آنلاین ۲۰ دقیقه‌ای را با شما هماهنگ کند."
        />
        <div className="mx-auto max-w-xl">
          <DemoRequestForm />
        </div>
      </Section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "AvinApps",
          url: absoluteUrl("/"),
          telephone: s.phone || undefined,
          email: s.email || undefined,
          address: s.address
            ? { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "IR" }
            : undefined,
          geo: loc?.lat
            ? { "@type": "GeoCoordinates", latitude: loc.lat, longitude: loc.lng }
            : undefined,
        }}
      />
    </>
  );
}

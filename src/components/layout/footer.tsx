import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { getMenu, getSettings, telHref } from "@/server/queries/settings";
import { getPublishedProducts } from "@/server/queries/catalog";
import { toFaDigits } from "@/lib/format";
import { LogoMark } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import {
  InstagramIcon,
  LinkedinIcon,
  TelegramIcon,
  WhatsAppIcon,
  telegramHref,
  whatsappHref,
} from "./social-icons";

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-bold">{title}</h2>
      <ul className="text-muted-foreground space-y-2.5 text-sm">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="hover:text-foreground transition">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  const [s, company, services, support, products] = await Promise.all([
    getSettings(),
    getMenu("footer-company"),
    getMenu("footer-services"),
    getMenu("footer-support"),
    getPublishedProducts(),
  ]);
  const featured = products.filter((p) => p.isFeatured).slice(0, 7);
  const socials = [
    s.whatsapp && { href: whatsappHref(s.whatsapp), label: "واتس‌اپ", Icon: WhatsAppIcon },
    s.telegram && { href: telegramHref(s.telegram), label: "تلگرام", Icon: TelegramIcon },
    s.instagram && {
      href: s.instagram.startsWith("http")
        ? s.instagram
        : `https://instagram.com/${s.instagram.replace(/^@/, "")}`,
      label: "اینستاگرام",
      Icon: InstagramIcon,
    },
    s.linkedin && { href: s.linkedin, label: "لینکدین", Icon: LinkedinIcon },
  ].filter(Boolean) as Array<{ href: string; label: string; Icon: typeof WhatsAppIcon }>;

  return (
    <footer className="bg-muted/30 mt-auto border-t">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-black" dir="ltr">
              AvinApps
            </span>
          </div>
          <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-7">
            آوین اپس سازنده‌ی نرم‌افزارهای حسابداری و مدیریت کسب‌وکار تخصصی برای{" "}
            {toFaDigits(s.stats.industries)} صنف است؛ با نسخه‌ی ویندوز، اندروید و تحت وب و اتصال
            کامل به سامانه‌ی مودیان مالیاتی.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {s.phone && (
              <li className="flex items-center gap-2">
                <Phone className="text-primary size-4" aria-hidden />
                <a href={telHref(s.phone)} className="hover:text-primary">
                  {s.phone}
                </a>
              </li>
            )}
            {s.email && (
              <li className="flex items-center gap-2">
                <Mail className="text-primary size-4" aria-hidden />
                <a href={`mailto:${s.email}`} className="hover:text-primary" dir="ltr">
                  {s.email}
                </a>
              </li>
            )}
            {s.address && (
              <li className="flex items-start gap-2">
                <MapPin className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="text-muted-foreground">{s.address}</span>
              </li>
            )}
            {s.workingHours && (
              <li className="flex items-center gap-2">
                <Clock className="text-primary size-4" aria-hidden />
                <span className="text-muted-foreground">{s.workingHours}</span>
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="bg-background hover:border-primary hover:text-primary flex size-10 items-center justify-center rounded-xl border transition"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
          <FooterColumn
            title="محصولات محبوب"
            items={featured.map((p) => ({
              label: `${p.name} — ${p.industryName}`,
              href: `/${p.slug}`,
            }))}
          />
          <FooterColumn title="خدمات" items={services} />
          <FooterColumn title="آوین اپس" items={company} />
          <FooterColumn title="پشتیبانی" items={support} />
          <div className="col-span-2 sm:col-span-4">
            <div className="bg-background grid items-center gap-6 rounded-2xl border p-5 md:grid-cols-2">
              <div>
                <h2 className="font-bold">عضویت در خبرنامه</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  خبر جشنواره‌های تخفیف و تغییرات قوانین مالیاتی را زودتر بدانید.
                </p>
                <NewsletterForm />
              </div>
              <div
                className="flex flex-wrap items-center justify-center gap-4 md:justify-end"
                aria-label="نمادهای اعتماد"
              >
                {s.enamadHtml ? (
                  <div
                    className="size-[110px]"
                    dangerouslySetInnerHTML={{ __html: s.enamadHtml }}
                  />
                ) : (
                  <div className="text-muted-foreground flex size-[110px] items-center justify-center rounded-xl border border-dashed text-center text-xs">
                    جایگاه نماد اینماد
                  </div>
                )}
                {s.samandehiHtml ? (
                  <div
                    className="size-[110px]"
                    dangerouslySetInnerHTML={{ __html: s.samandehiHtml }}
                  />
                ) : (
                  <div className="text-muted-foreground flex size-[110px] items-center justify-center rounded-xl border border-dashed text-center text-xs">
                    جایگاه نماد ساماندهی
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container-x text-muted-foreground flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
          <p>
            ©{" "}
            {toFaDigits(
              new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { year: "numeric" }).format(
                new Date(),
              ),
            )}{" "}
            آوین اپس — همه‌ی حقوق محفوظ است.
          </p>
          <p>وب‌سایت با کدنویسی اختصاصی، بدون وردپرس و قالب آماده</p>
        </div>
      </div>
    </footer>
  );
}

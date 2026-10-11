import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { telegramHref, whatsappHref } from "@/components/layout/social-icons";
import Script from "next/script";
import { getSeoSettings, getSettings, telHref } from "@/server/queries/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, seo] = await Promise.all([getSettings(), getSeoSettings()]);
  const ga = /^G-[A-Z0-9]{4,12}$/.test(seo.googleAnalyticsId) ? seo.googleAnalyticsId : null;
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingContact
        tel={s.phone ? telHref(s.phone) : undefined}
        whatsapp={s.whatsapp ? whatsappHref(s.whatsapp) : undefined}
        telegram={s.telegram ? telegramHref(s.telegram) : undefined}
      />
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="lazyOnload" />
          <Script id="ga" strategy="lazyOnload">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}</Script>
        </>
      )}
    </div>
  );
}

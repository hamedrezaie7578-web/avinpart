import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { telegramHref, whatsappHref } from "@/components/layout/social-icons";
import { getSettings, telHref } from "@/server/queries/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
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
    </div>
  );
}

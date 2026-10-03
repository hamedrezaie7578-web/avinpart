import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NotFoundContent } from "@/components/sections/not-found-content";

export const metadata: Metadata = { title: "صفحه پیدا نشد", robots: { index: false } };

/** ۴۰۴ برای مسیرهای خارج از گروه (site) */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </div>
  );
}

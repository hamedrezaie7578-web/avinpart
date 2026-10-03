import type { Metadata, Viewport } from "next";
import { vazirmatn } from "./fonts";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AvinApps | نرم‌افزار حسابداری و مدیریت کسب‌وکار برای همه‌ی صنف‌ها",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "نرم‌افزار حسابداری فروشگاهی تخصصی برای هر صنف؛ نسخه‌ی ویندوز، اندروید و تحت وب، اتصال به سامانه‌ی مودیان و طراحی نرم‌افزار و سایت اختصاصی.",
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

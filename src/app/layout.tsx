import type { Metadata, Viewport } from "next";
import { vazirmatn } from "./fonts";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getSeoSettings } from "@/server/queries/settings";
import "@/styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.defaultTitle, template: `%s | ${SITE_NAME}` },
    description: seo.defaultDescription,
    applicationName: SITE_NAME,
    formatDetection: { telephone: false },
    ...(seo.googleSiteVerification ? { verification: { google: seo.googleSiteVerification } } : {}),
  };
}

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

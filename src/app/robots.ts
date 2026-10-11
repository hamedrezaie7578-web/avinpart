import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { getSeoSettings } from "@/server/queries/settings";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoSettings();
  // قوانین اضافه‌ی پنل سئو: هر خط «Disallow: /path» یا «Allow: /path»
  const extra = seo.robotsExtra.split("\n").map((l) => l.trim()).filter(Boolean);
  const disallow = ["/admin", "/admin-login", "/dashboard", "/api/", "/cart", "/checkout", "/payment/", "/login", "/maintenance", "/design-system", ...extra.filter((l) => /^disallow:/i.test(l)).map((l) => l.replace(/^disallow:\s*/i, ""))];
  const allow = ["/", ...extra.filter((l) => /^allow:/i.test(l)).map((l) => l.replace(/^allow:\s*/i, ""))];
  return {
    rules: [{ userAgent: "*", allow, disallow }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}

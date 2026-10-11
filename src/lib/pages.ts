/** صفحات سیستمی با مسیر ثابت؛ صفحات دیگر در /p/[slug] نمایش داده می‌شوند */
export const SYSTEM_PAGES: Record<string, string> = {
  home: "/",
  about: "/about",
  terms: "/terms",
  privacy: "/privacy",
  "refund-policy": "/refund-policy",
  "website-design": "/website-design",
  "custom-software": "/custom-software",
};

export function pagePath(slug: string): string {
  return SYSTEM_PAGES[slug] ?? `/p/${slug}`;
}

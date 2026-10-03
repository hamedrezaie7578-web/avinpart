/** درج داده‌ی ساختاریافته‌ی JSON-LD (با escape امن برای جلوگیری از تزریق اسکریپت) */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

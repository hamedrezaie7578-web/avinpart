import { Icon } from "@/components/design-system/icon";

type Item = {
  slug: string;
  title: string;
  client: string | null;
  summary: string;
  tags: string[];
  type: string;
};

const ICON_BY_TYPE: Record<string, string> = { CUSTOM_SOFTWARE: "Code2", WEBSITE: "Globe" };

/** کارت‌های نمونه‌کار (بدون تصویر کاور، با طرح گرافیکی گرادیانی) */
export function PortfolioGrid({ items }: { items: Item[] }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => (
        <li key={p.slug} className="group bg-card flex flex-col overflow-hidden rounded-3xl border">
          <div
            className="relative flex h-40 items-end p-5 text-white"
            style={{
              background: `linear-gradient(135deg, hsl(${(230 + i * 37) % 360} 70% 38%), hsl(${(270 + i * 37) % 360} 65% 48%))`,
            }}
          >
            <div className="bg-grid absolute inset-0 opacity-70" aria-hidden />
            <Icon
              name={ICON_BY_TYPE[p.type] ?? "Layers"}
              className="absolute end-5 top-5 size-10 opacity-80 transition group-hover:scale-110"
            />
            <span className="relative rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
              {p.client}
            </span>
          </div>
          <div className="flex flex-1 flex-col p-6">
            <h3 className="text-lg leading-8 font-extrabold">{p.title}</h3>
            <p className="text-muted-foreground mt-2 flex-1 leading-7">{p.summary}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <li key={t} className="bg-muted rounded-full px-3 py-1 text-xs font-medium">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  );
}

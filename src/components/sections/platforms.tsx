import { Check, Globe, Monitor, Smartphone } from "lucide-react";
import { Section, SectionHeader } from "@/components/design-system/section-header";

const PLATFORMS = [
  {
    Icon: Monitor,
    name: "نسخه‌ی ویندوز",
    desc: "سریع، پایدار و مناسب پشت صندوق؛ حتی وقتی اینترنت قطع است، فروش متوقف نمی‌شود.",
    points: [
      "کار کامل بدون اینترنت",
      "اتصال به بارکدخوان، پوز و چاپگر فیش",
      "مناسب صندوق و حسابداری روزانه",
    ],
  },
  {
    Icon: Smartphone,
    name: "نسخه‌ی اندروید",
    desc: "فروش، انبارگردانی و گزارش روی گوشی و تبلت؛ کسب‌وکارتان همیشه در جیب شماست.",
    points: [
      "صدور فاکتور و چاپ با پرینتر بلوتوثی",
      "انبارگردانی با دوربین گوشی",
      "گزارش لحظه‌ای فروش برای مدیر",
    ],
  },
  {
    Icon: Globe,
    name: "نسخه‌ی تحت وب",
    desc: "بدون نصب، از هر مرورگر و هر نقطه؛ مدیریت چند شعبه و چند کاربر به‌صورت هم‌زمان.",
    points: [
      "دسترسی امن از هر جا",
      "همگام‌سازی لحظه‌ای با ویندوز و اندروید",
      "مناسب مدیر، حسابدار و شعبه‌ها",
    ],
  },
];

export function PlatformsSection({
  title,
  description,
  muted,
}: {
  title?: string;
  description?: string;
  muted?: boolean;
}) {
  return (
    <Section muted={muted} aria-labelledby="platforms-title">
      <SectionHeader
        id="platforms-title"
        eyebrow="ویندوز · اندروید · وب"
        title={title ?? "یک نرم‌افزار، سه نسخه؛ همه با هم همگام"}
        description={
          description ??
          "فاکتوری که پشت صندوق صادر می‌شود، همان لحظه روی گوشی شما و در پنل تحت وب حسابدار دیده می‌شود. هر نسخه برای کاری ساخته شده که بهترین انجامش می‌دهد."
        }
      />
      <div className="grid gap-6 md:grid-cols-3">
        {PLATFORMS.map(({ Icon, name, desc, points }) => (
          <article key={name} className="bg-card relative overflow-hidden rounded-3xl border p-7">
            <div
              className="bg-brand-gradient absolute -end-10 -top-10 size-32 rounded-full opacity-10 blur-2xl"
              aria-hidden
            />
            <span className="bg-brand-gradient text-brand-hero-fg flex size-14 items-center justify-center rounded-2xl shadow-lg">
              <Icon className="size-7" aria-hidden />
            </span>
            <h3 className="mt-5 text-xl font-extrabold">{name}</h3>
            <p className="text-muted-foreground mt-2 leading-7">{desc}</p>
            <ul className="mt-5 space-y-2.5">
              {points.map((p) => (
                <li key={p} className="flex gap-2 text-sm">
                  <Check className="text-brand size-5 shrink-0" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}

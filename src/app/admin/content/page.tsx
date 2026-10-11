import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPage, Card, LinkButton, Tabs } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/form";
import { ListSaveForm } from "@/components/admin/list-save";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/admin/guard";
import { saveGeneralFaqs, saveGeneralTestimonials, toggleTestimonial } from "@/server/actions/admin/content";

export const metadata = { title: "محتوا" };

const TABS = [
  { key: "portfolio", label: "نمونه‌کارها" },
  { key: "testimonials", label: "نظرات مشتریان" },
  { key: "faq", label: "سؤالات متداول عمومی" },
];
const FAQ_GROUPS = [
  ["general", "عمومی"],
  ["payment", "خرید و پرداخت"],
  ["license", "لایسنس و ارتقا"],
  ["custom", "نرم‌افزار اختصاصی"],
  ["website", "طراحی سایت"],
] as const;
const TESTIMONIAL_FIELDS = [
  { key: "name", label: "نام" },
  { key: "role", label: "سمت و شهر" },
  { key: "body", label: "متن نظر", type: "textarea" as const },
  { key: "rating", label: "امتیاز (۱ تا ۵)", type: "number" as const },
  { key: "isSample", label: "نمونه", type: "checkbox" as const },
  { key: "isPublished", label: "منتشرشده", type: "checkbox" as const },
];

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("content.read");
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "portfolio";
  return (
    <AdminPage title="نمونه‌کار، نظرات و سؤالات" actions={tab === "portfolio" && <LinkButton href="/admin/content/portfolio/new"><Plus className="size-4" aria-hidden />نمونه‌کار جدید</LinkButton>}>
      <Tabs base="/admin/content" tabs={TABS} active={tab} />
      {tab === "portfolio" && <Portfolio />}
      {tab === "testimonials" && <Testimonials />}
      {tab === "faq" && <Faqs />}
    </AdminPage>
  );
}

async function Portfolio() {
  const items = await db.portfolioItem.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <Link key={p.id} href={`/admin/content/portfolio/${p.id}`} className="rounded-2xl border bg-card p-4 transition hover:border-primary">
          <div className="flex items-center gap-2">
            <StatusBadge tone={p.type === "WEBSITE" ? "blue" : "amber"}>{p.type === "WEBSITE" ? "وب‌سایت" : "نرم‌افزار اختصاصی"}</StatusBadge>
            {!p.isPublished && <StatusBadge tone="gray">پیش‌نویس</StatusBadge>}
          </div>
          <p className="mt-3 font-bold">{p.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.summary}</p>
        </Link>
      ))}
      {!items.length && <p className="text-sm text-muted-foreground">نمونه‌کاری ثبت نشده است.</p>}
    </div>
  );
}

async function Testimonials() {
  const [general, product] = await Promise.all([
    db.testimonial.findMany({ where: { productId: null }, orderBy: { sortOrder: "asc" } }),
    db.testimonial.findMany({ where: { productId: { not: null } }, orderBy: [{ product: { sortOrder: "asc" } }, { sortOrder: "asc" }], include: { product: { select: { id: true, name: true } } } }),
  ]);
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="نظرات عمومی (صفحه‌ی اصلی)">
        <p className="mb-3 text-sm text-muted-foreground">نظرات «نمونه» با برچسب «نظر نمونه» نمایش داده می‌شوند تا تا زمان جمع‌آوری نظرات واقعی، شفاف باشیم.</p>
        <ListSaveForm action={saveGeneralTestimonials} initial={general.map((t) => ({ name: t.name, role: t.role, body: t.body, rating: t.rating, isSample: t.isSample, isPublished: t.isPublished }))} fields={TESTIMONIAL_FIELDS} empty={{ name: "", role: "", body: "", rating: 5, isSample: true, isPublished: true }} addLabel="افزودن نظر" />
      </Card>
      <Card title="نظرات محصولات">
        <ul className="divide-y">
          {product.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
              <Link href={`/admin/products/${t.product!.id}?tab=testimonials`} className="font-bold hover:text-primary">{t.product!.name}</Link>
              <span className="text-muted-foreground">— {t.name}</span>
              <span className="ms-auto flex gap-1">
                <ActionButton action={toggleTestimonial.bind(null, t.id, "isSample")} variant={t.isSample ? "outline" : "default"}>{t.isSample ? "نمونه" : "واقعی"}</ActionButton>
                <ActionButton action={toggleTestimonial.bind(null, t.id, "isPublished")} variant="ghost">{t.isPublished ? "منتشرشده" : "مخفی"}</ActionButton>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

async function Faqs() {
  const faqs = await db.faq.findMany({ where: { productId: null }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {FAQ_GROUPS.map(([g, label]) => (
        <Card key={g} title={label}>
          <ListSaveForm action={saveGeneralFaqs.bind(null, g)} initial={faqs.filter((f) => f.group === g).map((f) => ({ question: f.question, answer: f.answer }))} fields={[{ key: "question", label: "سؤال", width: "full" }, { key: "answer", label: "پاسخ", type: "textarea" }]} addLabel="افزودن سؤال" />
        </Card>
      ))}
    </div>
  );
}

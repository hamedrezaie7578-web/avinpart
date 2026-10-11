import { AdminPage, Card } from "@/components/admin/ui";
import { ListSaveForm } from "@/components/admin/list-save";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/admin/guard";
import { saveMenu } from "@/server/actions/admin/content";

export const metadata = { title: "منوها" };

const MENUS = [
  ["header", "منوی اصلی هدر", "آیتمی با لینک /products به‌صورت مگامنوی محصولات نمایش داده می‌شود."],
  ["footer-company", "فوتر — ستون آوین اپس", ""],
  ["footer-services", "فوتر — ستون خدمات", ""],
  ["footer-support", "فوتر — ستون پشتیبانی", ""],
] as const;

export default async function MenusPage() {
  await requireAdmin("menus.read");
  const menus = await db.menu.findMany({ include: { items: { orderBy: { sortOrder: "asc" } } } });
  const byKey = new Map(menus.map((m) => [m.key, m.items]));
  return (
    <AdminPage title="منوها">
      <div className="grid gap-6 xl:grid-cols-2">
        {MENUS.map(([key, title, hint]) => (
          <Card key={key} title={title}>
            {hint && <p className="mb-3 text-sm text-muted-foreground">{hint}</p>}
            <ListSaveForm
              action={saveMenu.bind(null, key)}
              initial={(byKey.get(key) ?? []).map((i) => ({ label: i.label, href: i.href }))}
              fields={[{ key: "label", label: "متن" }, { key: "href", label: "لینک", type: "url", placeholder: "/pricing" }]}
              addLabel="افزودن لینک"
            />
          </Card>
        ))}
      </div>
    </AdminPage>
  );
}

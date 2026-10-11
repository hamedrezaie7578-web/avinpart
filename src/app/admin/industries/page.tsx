import { AdminPage, Card } from "@/components/admin/ui";
import { ActionForm, DeleteButton, Field } from "@/components/admin/form";
import { ProductOrder } from "@/components/admin/product-order";
import { db } from "@/lib/db";
import { toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { deleteCategory, reorderProducts, saveCategory } from "@/server/actions/admin/products";

export const metadata = { title: "صنف‌ها و دسته‌ها" };

export default async function IndustriesPage() {
  await requireAdmin("industries.read");
  const [cats, products] = await Promise.all([
    db.industryCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
    db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, industryName: true, categoryId: true } }),
  ]);
  return (
    <AdminPage title="صنف‌ها و دسته‌ها" description="دسته‌ها در مگامنو و فیلتر صفحه‌ی محصولات استفاده می‌شوند.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <Card title="دسته‌ی جدید">
            <ActionForm action={saveCategory.bind(null, null)} resetOnSuccess submitLabel="افزودن">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="نام" name="name" required />
                <Field label="نامک" name="slug" required dir="ltr" />
                <Field label="ترتیب" name="sortOrder" type="number" defaultValue={cats.length} />
              </div>
            </ActionForm>
          </Card>
          {cats.map((c) => (
            <Card key={c.id} title={`${c.name} (${toFaDigits(c._count.products)} محصول)`} actions={<DeleteButton action={deleteCategory.bind(null, c.id)} />}>
              <ActionForm action={saveCategory.bind(null, c.id)}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="نام" name="name" required defaultValue={c.name} />
                  <Field label="نامک" name="slug" required dir="ltr" defaultValue={c.slug} />
                  <Field label="ترتیب" name="sortOrder" type="number" defaultValue={c.sortOrder} />
                </div>
              </ActionForm>
            </Card>
          ))}
        </div>
        <Card title="ترتیب و دسته‌بندی محصولات">
          <ProductOrder initial={products} cats={cats.map((c) => ({ id: c.id, name: c.name }))} action={reorderProducts} />
        </Card>
      </div>
    </AdminPage>
  );
}

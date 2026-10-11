import { AdminPage, Card } from "@/components/admin/ui";
import { ActionForm, Field, Select, TextArea } from "@/components/admin/form";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/admin/guard";
import { createManualLicense } from "@/server/actions/admin/licenses";

export const metadata = { title: "صدور لایسنس دستی" };

export default async function NewLicensePage() {
  await requireAdmin("licenses.write");
  const [products, plans] = await Promise.all([db.product.findMany({ orderBy: { sortOrder: "asc" } }), db.plan.findMany({ orderBy: { sortOrder: "asc" } })]);
  return (
    <AdminPage title="صدور لایسنس دستی" description="برای فروش حضوری، نمایندگی یا هدیه. اگر مشتری حساب نداشته باشد با همین موبایل ساخته می‌شود." back={{ href: "/admin/licenses", label: "لایسنس‌ها" }}>
      <Card className="max-w-2xl">
        <ActionForm action={createManualLicense} redirectTo={(d) => `/admin/licenses/${(d as { id: string }).id}`} submitLabel="صدور لایسنس">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="موبایل مشتری" name="mobile" dir="ltr" required />
            <Field label="نام مشتری (اختیاری)" name="name" />
            <Select label="محصول" name="productId" options={products.map((p) => ({ value: p.id, label: `${p.name} — ${p.industryName}` }))} />
            <Select label="پلن" name="planId" options={plans.map((p) => ({ value: p.id, label: p.name }))} />
            <Field label="حداکثر دستگاه (خالی = پیش‌فرض پلن)" name="maxDevices" type="number" min={1} />
            <Field label="تاریخ انقضا (خالی = طبق پلن)" name="expiresAt" type="datetime-local" />
          </div>
          <TextArea label="یادداشت" name="note" rows={2} />
        </ActionForm>
      </Card>
    </AdminPage>
  );
}

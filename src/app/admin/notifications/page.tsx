import { AdminPage, Card, Tabs } from "@/components/admin/ui";
import { ActionForm, Check, Field, Select, TextArea } from "@/components/admin/form";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { saveTemplate, sendBulkSms } from "@/server/actions/admin/ops";

export const metadata = { title: "اعلان‌ها و پیامک" };

const TEMPLATE_INFO: Record<string, [string, string]> = {
  otp: ["کد ورود", "{{code}}"],
  order_paid: ["پرداخت موفق سفارش", "{{name}}، {{number}}"],
  ticket_answered: ["پاسخ به تیکت", "{{number}}"],
  custom_order_created: ["ثبت سفارش اختصاصی", "{{trackingCode}}"],
  custom_order_status: ["تغییر وضعیت سفارش اختصاصی", "{{trackingCode}}، {{status}}"],
  license_expiring: ["یادآوری تمدید سرویس ابری", "{{name}}، {{product}}، {{days}}"],
  demo_request_admin: ["اطلاع درخواست دمو به مدیر", "{{name}}، {{mobile}}، {{product}}"],
};

const TABS = [
  { key: "templates", label: "قالب‌ها" },
  { key: "bulk", label: "پیامک گروهی" },
  { key: "log", label: "گزارش ارسال" },
];

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("notifications.read");
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "templates";
  return (
    <AdminPage title="اعلان‌ها و پیامک" description={`ارائه‌دهنده‌ی فعلی: ${process.env.SMS_PROVIDER === "kavenegar" && process.env.KAVENEGAR_API_KEY ? "کاوه‌نگار" : "کنسول (حالت توسعه — پیامک واقعی ارسال نمی‌شود)"}`}>
      <Tabs base="/admin/notifications" tabs={TABS} active={tab} />
      {tab === "templates" && <Templates />}
      {tab === "bulk" && <Bulk />}
      {tab === "log" && <Log />}
    </AdminPage>
  );
}

async function Templates() {
  const items = await db.notificationTemplate.findMany({ orderBy: { key: "asc" } });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((t) => {
        const [title, vars] = TEMPLATE_INFO[t.key] ?? [t.key, ""];
        return (
          <Card key={t.id} title={<span>{title} <span className="font-mono text-xs font-normal text-muted-foreground" dir="ltr">{t.key}</span></span>}>
            <ActionForm action={saveTemplate.bind(null, t.id)}>
              <TextArea label="متن پیامک" name="body" rows={4} defaultValue={t.body} hint={vars ? `متغیرها: ${vars}` : undefined} />
              <Field label="نام قالب Verify Lookup کاوه‌نگار (اختیاری)" name="kavenegarTemplate" dir="ltr" defaultValue={t.kavenegarTemplate ?? ""} />
              <Check name="isActive" label="فعال" defaultChecked={t.isActive} />
            </ActionForm>
          </Card>
        );
      })}
    </div>
  );
}

async function Bulk() {
  const products = await db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <Card className="max-w-2xl" title="ارسال پیامک گروهی">
      <ActionForm action={sendBulkSms} submitLabel="ارسال">
        <Select label="گیرندگان" name="audience" options={[{ value: "all", label: "همه‌ی مشتریان" }, { value: "licensed", label: "مشتریان دارای لایسنس فعال" }, { value: "product", label: "دارندگان لایسنس یک محصول" }, { value: "custom", label: "فهرست شماره‌ها" }]} />
        <Select label="محصول (برای گزینه‌ی «یک محصول»)" name="productId" options={products.map((p) => ({ value: p.id, label: p.name }))} />
        <TextArea label="شماره‌ها (برای گزینه‌ی «فهرست شماره‌ها»؛ با فاصله یا کاما)" name="mobiles" rows={3} dir="ltr" />
        <TextArea label="متن پیامک ({{name}} = نام مشتری)" name="body" rows={4} required maxLength={600} hint="برای پیامک تبلیغاتی، عبارت «لغو۱۱» را طبق قوانین مخابرات در انتها بیاورید." />
        <Check name="dryRun" label="فقط شمارش گیرندگان (بدون ارسال)" defaultChecked />
      </ActionForm>
    </Card>
  );
}

async function Log() {
  const [logs, stats] = await Promise.all([
    db.smsLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.smsLog.groupBy({ by: ["status"], _count: true, where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } } }),
  ]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">۳۰ روز اخیر: {stats.map((s) => `${s.status === "sent" ? "موفق" : "ناموفق"} ${toFaDigits(s._count)}`).join(" — ") || "بدون ارسال"}</p>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr><th scope="col" className="px-4 py-2 text-start font-medium">موبایل</th><th scope="col" className="px-4 py-2 text-start font-medium">قالب</th><th scope="col" className="px-4 py-2 text-start font-medium">وضعیت</th><th scope="col" className="px-4 py-2 text-start font-medium">سرویس</th><th scope="col" className="px-4 py-2 text-start font-medium">زمان</th></tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2" dir="ltr">{l.mobile.replace(/(\d{4})\d{3}(\d{4})/, "$1***$2")}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.template ?? "—"}</td>
                <td className="px-4 py-2"><StatusBadge tone={l.status === "sent" ? "green" : "red"}>{l.status === "sent" ? "موفق" : "ناموفق"}</StatusBadge></td>
                <td className="px-4 py-2">{l.provider}</td>
                <td className="px-4 py-2 text-muted-foreground">{formatDateTime(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

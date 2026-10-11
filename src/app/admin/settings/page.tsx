import { AdminPage, Card, Tabs } from "@/components/admin/ui";
import { ActionForm, Check, Field, Select, TextArea } from "@/components/admin/form";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { configSource, getConfig, type ConfigKey } from "@/lib/secrets";
import { requireAdmin } from "@/server/admin/guard";
import { saveGeneralSettings, saveIntegrations } from "@/server/actions/admin/settings";

export const metadata = { title: "تنظیمات" };

const GROUPS: Array<[string, Array<[string, string, ("ltr" | "area")?]>]> = [
  ["هویت سایت", [["site.name", "نام لاتین", "ltr"], ["site.nameFa", "نام فارسی"], ["site.tagline", "شعار"]]],
  ["اطلاعات تماس", [["contact.phone", "تلفن ثابت"], ["contact.mobile", "موبایل"], ["contact.email", "ایمیل", "ltr"], ["contact.workingHours", "ساعات کاری"], ["contact.address", "نشانی", "area"]]],
  ["شبکه‌های اجتماعی (شناسه یا لینک)", [["social.whatsapp", "واتس‌اپ (شماره)", "ltr"], ["social.telegram", "تلگرام", "ltr"], ["social.instagram", "اینستاگرام", "ltr"], ["social.linkedin", "لینکدین", "ltr"], ["social.aparat", "آپارات", "ltr"]]],
  ["نمادهای اعتماد (کد HTML ارائه‌شده)", [["trust.enamadHtml", "کد اینماد", "area"], ["trust.samandehiHtml", "کد ساماندهی", "area"]]],
];
const NUMBERS: Array<[string, string]> = [["stats.customers", "تعداد مشتریان"], ["stats.years", "سال تجربه"], ["stats.satisfaction", "رضایت (درصد)"], ["stats.industries", "تعداد صنف‌ها"], ["billing.taxPercent", "مالیات بر ارزش افزوده (درصد)"]];

const SOURCE = { panel: ["green", "از پنل"], env: ["blue", "از env"], none: ["gray", "تنظیم نشده"] } as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("settings.read");
  const sp = await searchParams;
  const tab = sp.tab === "integrations" ? "integrations" : "general";
  return (
    <AdminPage title="تنظیمات عمومی">
      <Tabs base="/admin/settings" tabs={[{ key: "general", label: "عمومی" }, { key: "integrations", label: "درگاه پرداخت و پیامک" }]} active={tab} />
      {tab === "general" ? <General /> : <Integrations />}
    </AdminPage>
  );
}

async function General() {
  const rows = await db.setting.findMany({ where: { isSecret: false } });
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const s = (k: string) => (m.get(k) == null ? "" : String(m.get(k)));
  return (
    <ActionForm action={saveGeneralSettings} className="max-w-4xl">
      {GROUPS.map(([title, fields]) => (
        <Card key={title} title={title}>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(([k, label, kind]) => (kind === "area" ? <TextArea key={k} name={k} label={label} defaultValue={s(k)} rows={3} className="sm:col-span-2" dir={k.startsWith("trust.") ? "ltr" : undefined} /> : <Field key={k} name={k} label={label} defaultValue={s(k)} dir={kind === "ltr" ? "ltr" : undefined} />))}
          </div>
        </Card>
      ))}
      <Card title="آمار و مالی">
        <div className="grid gap-3 sm:grid-cols-3">{NUMBERS.map(([k, label]) => <Field key={k} name={k} label={label} type="number" min={0} defaultValue={s(k)} />)}</div>
      </Card>
      <Card title="حالت تعمیر">
        <Check name="site.maintenance" label="فعال‌سازی حالت تعمیر (بازدیدکنندگان صفحه‌ی «در حال به‌روزرسانی» می‌بینند؛ مدیران واردشده سایت را عادی می‌بینند)" defaultChecked={m.get("site.maintenance") === true} />
      </Card>
    </ActionForm>
  );
}

async function Integrations() {
  const keys: ConfigKey[] = ["payment.gateway", "payment.zarinpal.merchant", "payment.zarinpal.sandbox", "sms.provider", "sms.kavenegar.apiKey", "sms.kavenegar.sender", "sms.kavenegar.otpTemplate", "sms.adminMobile"];
  const src = Object.fromEntries(await Promise.all(keys.map(async (k) => [k, await configSource(k)] as const))) as Record<ConfigKey, keyof typeof SOURCE>;
  const val = Object.fromEntries(await Promise.all(keys.filter((k) => !k.includes("merchant") && !k.includes("apiKey")).map(async (k) => [k, (await getConfig(k)) ?? ""] as const))) as Record<string, string>;
  const badge = (k: ConfigKey) => <StatusBadge tone={SOURCE[src[k]][0]}>{SOURCE[src[k]][1]}</StatusBadge>;
  const secret = (k: ConfigKey, label: string) => (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">{label} {badge(k)}</div>
      <input name={k} type="password" autoComplete="off" dir="ltr" placeholder={src[k] === "none" ? "" : "•••••••• (برای تغییر، مقدار جدید وارد کنید)"} className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" aria-label={label} />
      {src[k] === "panel" && <label className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" name={`${k}__clear`} className="size-3.5" />حذف مقدار ذخیره‌شده</label>}
    </div>
  );
  return (
    <ActionForm action={saveIntegrations} className="max-w-3xl">
      <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">مقادیر محرمانه با AES-256-GCM رمزنگاری و ذخیره می‌شوند و هرگز در پنل نمایش داده نمی‌شوند. اگر مقداری در پنل تنظیم نشود، متغیر محیطی (env) استفاده می‌شود.</p>
      <Card title="درگاه پرداخت">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="درگاه فعال" name="payment.gateway" defaultValue={val["payment.gateway"] || "mock"} options={[{ value: "zarinpal", label: "زرین‌پال" }, { value: "mock", label: "آزمایشی (فقط محیط توسعه)" }]} />
          <Select label="حالت Sandbox زرین‌پال" name="payment.zarinpal.sandbox" defaultValue={val["payment.zarinpal.sandbox"] || "false"} options={[{ value: "false", label: "خیر (واقعی)" }, { value: "true", label: "بله (تست)" }]} />
          {secret("payment.zarinpal.merchant", "مرچنت‌کد زرین‌پال")}
        </div>
      </Card>
      <Card title="پیامک">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="سرویس پیامک" name="sms.provider" defaultValue={val["sms.provider"] || "console"} options={[{ value: "kavenegar", label: "کاوه‌نگار" }, { value: "console", label: "کنسول (توسعه)" }]} />
          {secret("sms.kavenegar.apiKey", "API Key کاوه‌نگار")}
          <Field label="شماره‌ی فرستنده" name="sms.kavenegar.sender" dir="ltr" defaultValue={val["sms.kavenegar.sender"]} />
          <Field label="نام قالب OTP (Verify Lookup)" name="sms.kavenegar.otpTemplate" dir="ltr" defaultValue={val["sms.kavenegar.otpTemplate"]} />
          <Field label="موبایل مدیر برای اطلاع درخواست دمو" name="sms.adminMobile" dir="ltr" defaultValue={val["sms.adminMobile"]} />
        </div>
      </Card>
    </ActionForm>
  );
}

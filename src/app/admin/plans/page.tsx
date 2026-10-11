import { AdminPage, Card, Tabs } from "@/components/admin/ui";
import { ActionForm, Check, DeleteButton, Field, Select, TextArea } from "@/components/admin/form";
import { ComparisonEditor } from "@/components/admin/comparison-editor";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatNumber, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { toLocalInput } from "@/server/admin/fd";
import { deleteDiscount, saveComparison, saveDiscount, savePlan } from "@/server/actions/admin/plans";

export const metadata = { title: "پلن‌ها و قیمت‌ها" };

const TABS = [
  { key: "plans", label: "پلن‌ها" },
  { key: "comparison", label: "جدول مقایسه" },
  { key: "discounts", label: "تخفیف‌های زمان‌دار" },
];
const PLATFORMS = [["WINDOWS", "ویندوز"], ["ANDROID", "اندروید"], ["WEB", "وب"], ["IOS", "iOS"]] as const;

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("plans.read");
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "plans";
  const plans = await db.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <AdminPage title="پلن‌ها و قیمت‌ها" description="تغییر قیمت سراسری روی همه‌ی محصولات اعمال می‌شود، مگر محصولی قیمت اختصاصی داشته باشد.">
      <Tabs base="/admin/plans" tabs={TABS} active={tab} />
      {tab === "plans" && <PlansTab plans={plans} />}
      {tab === "comparison" && <ComparisonTab plans={plans} />}
      {tab === "discounts" && <DiscountsTab plans={plans} />}
    </AdminPage>
  );
}

async function PlansTab({ plans }: { plans: Awaited<ReturnType<typeof db.plan.findMany>> }) {
  const hl = await db.setting.findMany({ where: { key: { in: plans.map((p) => `plan.${p.code}.highlights`) } } });
  const map = new Map(hl.map((h) => [h.key, h.value as string[]]));
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {plans.map((p) => (
        <Card key={p.id} title={<span className="flex items-center gap-2">{p.name} <span className="font-mono text-xs text-muted-foreground" dir="ltr">{p.code}</span>{p.isPopular && <StatusBadge tone="blue">محبوب</StatusBadge>}</span>}>
          <ActionForm action={savePlan.bind(null, p.id)}>
            <Field label="نام" name="name" required defaultValue={p.name} />
            <Field label="شعار کوتاه" name="tagline" defaultValue={p.tagline} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="قیمت (تومان)" name="price" required inputMode="numeric" dir="ltr" defaultValue={p.price} hint={formatNumber(p.price)} />
              <Field label="قیمت خط‌خورده" name="compareAtPrice" inputMode="numeric" dir="ltr" defaultValue={p.compareAtPrice ?? ""} />
              <Field label="مدت اعتبار (روز)" name="durationDays" type="number" defaultValue={p.durationDays ?? ""} hint="خالی = دائمی" />
              <Field label="هزینه‌ی تمدید" name="renewalPrice" inputMode="numeric" dir="ltr" defaultValue={p.renewalPrice ?? ""} />
              <Field label="حداکثر دستگاه" name="maxDevices" type="number" min={1} defaultValue={p.maxDevices} />
              <Field label="ترتیب" name="sortOrder" type="number" defaultValue={p.sortOrder} />
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">پلتفرم‌ها</legend>
              <div className="flex flex-wrap gap-4">{PLATFORMS.map(([v, l]) => <Check key={v} name="platforms" value={v} label={l} defaultChecked={p.platforms.includes(v)} />)}</div>
            </fieldset>
            <TextArea label="ویژگی‌های کارت قیمت (هر خط یک مورد)" name="highlights" rows={7} defaultValue={(map.get(`plan.${p.code}.highlights`) ?? []).join("\n")} />
            <div className="flex flex-wrap gap-4">
              <Check name="isPopular" label="پلن محبوب (برجسته)" defaultChecked={p.isPopular} />
              <Check name="isActive" label="فعال" defaultChecked={p.isActive} />
            </div>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}

async function ComparisonTab({ plans }: { plans: Array<{ id: string; name: string }> }) {
  const features = await db.comparisonFeature.findMany({ orderBy: { sortOrder: "asc" }, include: { values: true } });
  return (
    <ComparisonEditor
      plans={plans.map((p) => ({ id: p.id, name: p.name }))}
      action={saveComparison}
      initial={features.map((f) => ({ id: f.id, group: f.group, title: f.title, tooltip: f.tooltip ?? "", values: Object.fromEntries(f.values.map((v) => [v.planId, { included: v.included, note: v.note ?? "" }])) }))}
    />
  );
}

async function DiscountsTab({ plans }: { plans: Array<{ id: string; name: string }> }) {
  const [discounts, products] = await Promise.all([
    db.timedDiscount.findMany({ orderBy: { startsAt: "desc" }, include: { plan: true } }),
    db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const pname = new Map(products.map((p) => [p.id, p.name]));
  const now = new Date();
  const form = (d?: (typeof discounts)[number]) => (
    <div className="grid gap-3 sm:grid-cols-4">
      <Field label="عنوان (مثلاً جشنواره‌ی نوروز)" name="label" defaultValue={d?.label ?? ""} className="sm:col-span-2" />
      <Select label="پلن" name="planId" defaultValue={d?.planId ?? ""} options={[{ value: "", label: "همه‌ی پلن‌ها" }, ...plans.map((p) => ({ value: p.id, label: p.name }))]} />
      <Select label="محصول" name="productId" defaultValue={d?.productId ?? ""} options={[{ value: "", label: "همه‌ی محصولات" }, ...products.map((p) => ({ value: p.id, label: p.name }))]} />
      <Field label="درصد" name="percent" type="number" min={1} max={90} defaultValue={d?.percent ?? ""} />
      <Field label="یا مبلغ (تومان)" name="amount" inputMode="numeric" dir="ltr" defaultValue={d?.amount ?? ""} />
      <Field label="شروع" name="startsAt" type="datetime-local" required defaultValue={toLocalInput(d?.startsAt)} />
      <Field label="پایان" name="endsAt" type="datetime-local" required defaultValue={toLocalInput(d?.endsAt)} />
      <Check name="isActive" label="فعال" defaultChecked={d?.isActive ?? true} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Card title="تخفیف زمان‌دار جدید">
        <ActionForm action={saveDiscount.bind(null, null)} resetOnSuccess submitLabel="افزودن">{form()}</ActionForm>
      </Card>
      {discounts.map((d) => {
        const live = d.isActive && d.startsAt <= now && d.endsAt > now;
        return (
          <Card
            key={d.id}
            title={
              <span className="flex flex-wrap items-center gap-2">
                {d.label ?? "تخفیف"} — {d.percent ? `${toFaDigits(d.percent)}٪` : `${formatNumber(d.amount ?? 0)} تومان`}
                <span className="text-xs font-normal text-muted-foreground">({d.plan?.name ?? "همه‌ی پلن‌ها"}، {d.productId ? pname.get(d.productId) : "همه‌ی محصولات"}؛ {formatDate(d.startsAt)} تا {formatDate(d.endsAt)})</span>
                {live ? <StatusBadge tone="green">در حال اجرا</StatusBadge> : d.endsAt <= now ? <StatusBadge tone="gray">پایان‌یافته</StatusBadge> : <StatusBadge tone="amber">{d.isActive ? "زمان‌بندی‌شده" : "غیرفعال"}</StatusBadge>}
              </span>
            }
            actions={<DeleteButton action={deleteDiscount.bind(null, d.id)} />}
          >
            <ActionForm action={saveDiscount.bind(null, d.id)}>{form(d)}</ActionForm>
          </Card>
        );
      })}
    </div>
  );
}

import type { Coupon } from "@prisma/client";
import { ActionForm, Check, Field, Select } from "./form";
import { toLocalInput } from "@/server/admin/fd";

type Opt = { id: string; name: string };

export function CouponForm({ coupon, products, plans, action }: { coupon?: Coupon | null; products: Opt[]; plans: Opt[]; action: (f: FormData) => Promise<{ ok: boolean; message?: string; data?: unknown }> }) {
  return (
    <ActionForm action={action} redirectTo="/admin/coupons">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="کد" name="code" dir="ltr" required defaultValue={coupon?.code} />
        <Select label="نوع" name="type" defaultValue={coupon?.type ?? "PERCENT"} options={[{ value: "PERCENT", label: "درصدی" }, { value: "AMOUNT", label: "مبلغ ثابت (تومان)" }]} />
        <Field label="مقدار" name="value" inputMode="numeric" required defaultValue={coupon?.value} />
        <Field label="سقف کل استفاده" name="maxUses" inputMode="numeric" defaultValue={coupon?.maxUses ?? ""} hint="خالی = نامحدود" />
        <Field label="سقف برای هر کاربر" name="perUserLimit" inputMode="numeric" defaultValue={coupon?.perUserLimit ?? 1} />
        <Field label="حداقل مبلغ سبد (تومان)" name="minAmount" inputMode="numeric" defaultValue={coupon?.minAmount ?? ""} />
        <Field label="شروع" name="startsAt" type="datetime-local" defaultValue={toLocalInput(coupon?.startsAt)} />
        <Field label="پایان" name="endsAt" type="datetime-local" defaultValue={toLocalInput(coupon?.endsAt)} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">محدود به محصولات (هیچ‌کدام = همه)</legend>
        <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border p-3 sm:grid-cols-3">
          {products.map((p) => <Check key={p.id} label={p.name} name="productIds" value={p.id} defaultChecked={coupon?.productIds.includes(p.id)} />)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">محدود به پلن‌ها (هیچ‌کدام = همه)</legend>
        <div className="flex flex-wrap gap-4">
          {plans.map((p) => <Check key={p.id} label={p.name} name="planIds" value={p.id} defaultChecked={coupon?.planIds.includes(p.id)} />)}
        </div>
      </fieldset>
      <Check label="فعال" name="isActive" defaultChecked={coupon?.isActive ?? true} />
    </ActionForm>
  );
}

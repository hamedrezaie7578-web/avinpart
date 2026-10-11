import { AdminPage, Card } from "@/components/admin/ui";
import { ActionForm, Field } from "@/components/admin/form";
import { TwoFactorSetup } from "@/components/admin/two-factor";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/admin/guard";
import { changeOwnPassword, confirmTwoFactor, disableTwoFactor } from "@/server/actions/admin/account";

export const metadata = { title: "حساب من" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  const u = await db.user.findUniqueOrThrow({ where: { id: admin.id }, include: { role: true } });
  return (
    <AdminPage title="حساب من" description={`${u.name ?? u.mobile} — نقش: ${u.role?.name ?? "—"}`}>
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card title="تغییر رمز عبور">
          <ActionForm action={changeOwnPassword} resetOnSuccess>
            <Field label="رمز فعلی" name="current" type="password" required autoComplete="current-password" />
            <Field label="رمز جدید" name="next" type="password" required autoComplete="new-password" hint="حداقل ۱۰ کاراکتر شامل حرف و عدد" />
            <Field label="تکرار رمز جدید" name="confirm" type="password" required autoComplete="new-password" />
          </ActionForm>
        </Card>
        <Card title={<span className="flex items-center gap-2">ورود دومرحله‌ای {u.totpEnabled ? <StatusBadge tone="green">فعال</StatusBadge> : <StatusBadge tone="gray">غیرفعال</StatusBadge>}</span>}>
          {u.totpEnabled ? (
            <ActionForm action={disableTwoFactor} submitLabel="غیرفعال‌سازی">
              <p className="text-sm text-muted-foreground">برای غیرفعال‌سازی، کد فعلی برنامه‌ی Authenticator را وارد کنید.</p>
              <Field label="کد ۶ رقمی" name="code" required inputMode="numeric" dir="ltr" maxLength={6} />
            </ActionForm>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">با فعال‌سازی، هنگام ورود علاوه بر رمز، کد ۶ رقمی برنامه‌ی Google Authenticator یا Microsoft Authenticator خواسته می‌شود.</p>
              <TwoFactorSetup />
              <ActionForm action={confirmTwoFactor} submitLabel="تأیید و فعال‌سازی">
                <Field label="کد ۶ رقمی" name="code" required inputMode="numeric" dir="ltr" maxLength={6} />
              </ActionForm>
            </div>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}

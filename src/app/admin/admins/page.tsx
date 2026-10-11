import { AdminPage, Card, Tabs } from "@/components/admin/ui";
import { ActionButton, ActionForm, Check, DeleteButton, Field, Select } from "@/components/admin/form";
import { StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { formatDateTime, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { deleteRole, resetAdmin2fa, saveAdmin, saveRole } from "@/server/actions/admin/admins";

export const metadata = { title: "مدیران و نقش‌ها" };

const ACTION_LABEL: Record<string, string> = { read: "مشاهده", write: "ویرایش", delete: "حذف", refund: "استرداد", revoke: "ابطال", block: "مسدودسازی", publish: "انتشار", send: "ارسال", export: "خروجی", backup: "پشتیبان‌گیری" };

export default async function AdminsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await requireAdmin("admins.read");
  const sp = await searchParams;
  const tab = sp.tab === "roles" ? "roles" : "admins";
  const roles = await db.role.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { users: true } } } });
  return (
    <AdminPage title="مدیران و نقش‌ها">
      <Tabs base="/admin/admins" tabs={[{ key: "admins", label: "مدیران" }, { key: "roles", label: "نقش‌ها و مجوزها" }]} active={tab} />
      {tab === "admins" ? <Admins roles={roles} meId={me.id} /> : <Roles roles={roles} />}
    </AdminPage>
  );
}

type R = Array<{ id: string; name: string; description: string | null; isSystem: boolean; permissions: string[]; _count: { users: number } }>;

async function Admins({ roles, meId }: { roles: R; meId: string }) {
  const admins = await db.user.findMany({ where: { type: "ADMIN" }, orderBy: { createdAt: "asc" }, include: { role: true } });
  const roleOpts = roles.map((r) => ({ value: r.id, label: r.name }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="مدیر جدید">
        <ActionForm action={saveAdmin.bind(null, null)} resetOnSuccess submitLabel="افزودن">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نام" name="name" required />
            <Field label="موبایل (نام کاربری)" name="mobile" required dir="ltr" inputMode="tel" />
            <Field label="ایمیل" name="email" type="email" dir="ltr" />
            <Select label="نقش" name="roleId" options={roleOpts} />
            <Field label="رمز عبور" name="password" type="password" required autoComplete="new-password" hint="حداقل ۱۰ کاراکتر شامل حرف و عدد" className="sm:col-span-2" />
          </div>
        </ActionForm>
      </Card>
      {admins.map((a) => (
        <Card
          key={a.id}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {a.name ?? a.mobile}
              {a.id === meId && <StatusBadge tone="blue">شما</StatusBadge>}
              {a.isBlocked && <StatusBadge tone="red">مسدود</StatusBadge>}
              {a.totpEnabled && <StatusBadge tone="green">2FA</StatusBadge>}
            </span>
          }
          actions={a.totpEnabled && <ActionButton action={resetAdmin2fa.bind(null, a.id)} confirm="ورود دومرحله‌ای این مدیر غیرفعال شود؟">بازنشانی 2FA</ActionButton>}
        >
          <p className="mb-3 text-xs text-muted-foreground">آخرین ورود: {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "—"}</p>
          <ActionForm action={saveAdmin.bind(null, a.id)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام" name="name" required defaultValue={a.name ?? ""} />
              <Field label="موبایل" name="mobile" required dir="ltr" defaultValue={a.mobile} />
              <Field label="ایمیل" name="email" type="email" dir="ltr" defaultValue={a.email ?? ""} />
              <Select label="نقش" name="roleId" options={roleOpts} defaultValue={a.roleId ?? ""} />
              <Field label="رمز عبور جدید (خالی = بدون تغییر)" name="password" type="password" autoComplete="new-password" className="sm:col-span-2" />
              <Check name="isBlocked" label="مسدود" defaultChecked={a.isBlocked} />
            </div>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}

function PermissionGrid({ selected }: { selected: string[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(PERMISSION_GROUPS).map(([mod, g]) => (
        <fieldset key={mod} className="rounded-xl border p-3">
          <legend className="px-1 text-sm font-bold">{g.label}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {g.actions.map((a) => <Check key={a} name="permissions" value={`${mod}.${a}`} label={ACTION_LABEL[a] ?? a} defaultChecked={selected.includes(`${mod}.${a}`)} />)}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function Roles({ roles }: { roles: R }) {
  return (
    <div className="space-y-4">
      <Card title="نقش جدید">
        <ActionForm action={saveRole.bind(null, null)} resetOnSuccess submitLabel="افزودن">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نام نقش" name="name" required />
            <Field label="توضیح" name="description" />
          </div>
          <PermissionGrid selected={["dashboard.read"]} />
        </ActionForm>
      </Card>
      {roles.map((r) => (
        <Card key={r.id} title={`${r.name} (${toFaDigits(r._count.users)} مدیر)`} actions={!r.isSystem && <DeleteButton action={deleteRole.bind(null, r.id)} />}>
          {r.isSystem ? (
            <p className="text-sm text-muted-foreground">نقش سیستمی با دسترسی کامل به همه‌ی بخش‌ها؛ قابل ویرایش یا حذف نیست.</p>
          ) : (
            <ActionForm action={saveRole.bind(null, r.id)}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نام نقش" name="name" required defaultValue={r.name} />
                <Field label="توضیح" name="description" defaultValue={r.description ?? ""} />
              </div>
              <PermissionGrid selected={r.permissions} />
            </ActionForm>
          )}
        </Card>
      ))}
    </div>
  );
}

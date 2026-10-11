import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { ADMIN_NAV } from "@/components/admin/nav-config";
import { hasPermission } from "@/lib/permissions";
import { logout } from "@/server/actions/auth";
import { requireAdmin } from "@/server/admin/guard";

export const metadata: Metadata = { title: { default: "پنل مدیریت", template: "%s | پنل مدیریت AvinApps" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const groups = ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => hasPermission(admin.permissions, i.perm)) })).filter((g) => g.items.length);
  return (
    <AdminShell groups={groups} user={{ name: admin.name, mobile: admin.mobile }} logout={logout}>
      {children}
    </AdminShell>
  );
}

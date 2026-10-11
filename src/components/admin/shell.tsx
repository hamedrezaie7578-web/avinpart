"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, Search } from "lucide-react";
import { Toaster } from "sonner";
import { ThemeToggle } from "@/components/design-system/theme-toggle";
import { AdminSidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { NotificationsBell } from "./notifications-bell";
import type { AdminNavGroup } from "./nav-config";

export function AdminShell({ groups, user, logout, children }: { groups: AdminNavGroup[]; user: { name: string | null; mobile: string }; logout: () => Promise<void>; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-dvh bg-muted/30">
      <AdminSidebar groups={groups} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="باز کردن منو"><Menu className="size-5" /></button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="flex h-10 w-full max-w-md items-center gap-2 rounded-xl border bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted"
          >
            <Search className="size-4" aria-hidden />
            <span className="flex-1 text-start">جست‌وجو…</span>
            <kbd className="hidden rounded border bg-background px-1.5 text-xs sm:inline" dir="ltr">Ctrl K</kbd>
          </button>
          <div className="ms-auto flex items-center gap-1">
            <NotificationsBell />
            <ThemeToggle />
            <Link href="/admin/account" className="mx-2 hidden text-sm font-medium hover:text-primary md:inline" title="حساب من">{user.name || user.mobile}</Link>
            <form action={logout}>
              <button type="submit" className="rounded-lg p-2 hover:bg-accent" aria-label="خروج"><LogOut className="size-5" /></button>
            </form>
          </div>
        </header>
        <main id="main" className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette groups={groups} />
      <Toaster position="bottom-left" richColors dir="rtl" toastOptions={{ style: { fontFamily: "inherit" } }} />
    </div>
  );
}

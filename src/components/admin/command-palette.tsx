"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/design-system/icon";
import type { AdminNavGroup } from "./nav-config";

type Hit = { type: string; label: string; sub?: string; href: string };

/** جست‌وجوی سراسری پنل با Ctrl+K: ماژول‌ها + مشتریان، سفارش‌ها، لایسنس‌ها، محصولات */
export function CommandPalette({ groups }: { groups: AdminNavGroup[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) return setHits([]);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (r.ok) setHits(((await r.json()) as { hits: Hit[] }).hits);
      } catch {}
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">جست‌وجوی سراسری</DialogTitle>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-5 text-muted-foreground" aria-hidden />
            <Command.Input value={q} onValueChange={setQ} placeholder="جست‌وجوی مشتری، سفارش، لایسنس، محصول یا بخش…" className="h-14 flex-1 bg-transparent outline-none" />
            <kbd className="rounded border px-1.5 text-xs text-muted-foreground" dir="ltr">Esc</kbd>
          </div>
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="p-6 text-center text-sm text-muted-foreground">نتیجه‌ای یافت نشد.</Command.Empty>
            {hits.length > 0 && (
              <Command.Group heading="نتایج">
                {hits.map((h) => (
                  <Command.Item key={h.href + h.label} value={h.href + h.label} onSelect={() => go(h.href)} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[0.65rem]">{h.type}</span>
                    <span className="font-medium">{h.label}</span>
                    {h.sub && <span className="truncate text-muted-foreground">{h.sub}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {groups.map((g) => {
              const items = g.items.filter((i) => !q || i.label.includes(q));
              if (!items.length) return null;
              return (
                <Command.Group key={g.title} heading={g.title}>
                  {items.map((i) => (
                    <Command.Item key={i.href} value={i.href} onSelect={() => go(i.href)} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent">
                      <Icon name={i.icon} className="size-4 text-muted-foreground" />
                      {i.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

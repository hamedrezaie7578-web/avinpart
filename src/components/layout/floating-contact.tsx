"use client";

import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TelegramIcon, WhatsAppIcon } from "./social-icons";

/** دکمه‌ی شناور تماس / واتس‌اپ / تلگرام */
export function FloatingContact({
  tel,
  whatsapp,
  telegram,
}: {
  tel?: string;
  whatsapp?: string;
  telegram?: string;
}) {
  const [open, setOpen] = useState(false);
  const items = [
    whatsapp && {
      href: whatsapp,
      label: "گفت‌وگو در واتس‌اپ",
      Icon: WhatsAppIcon,
      cls: "bg-[#128c4a]",
    },
    telegram && {
      href: telegram,
      label: "پیام در تلگرام",
      Icon: TelegramIcon,
      cls: "bg-[#1d7fb8]",
    },
    tel && { href: tel, label: "تماس تلفنی", Icon: Phone, cls: "bg-primary" },
  ].filter(Boolean) as Array<{ href: string; label: string; Icon: typeof Phone; cls: string }>;
  if (!items.length) return null;

  return (
    <div
      data-floating-contact
      className="fixed start-4 bottom-6 z-40 flex flex-col items-start gap-2 transition-all"
    >
      {open &&
        items.map(({ href, label, Icon, cls }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={cn(
              "animate-in fade-in-0 slide-in-from-bottom-2 flex items-center gap-2 rounded-full py-2 ps-2 pe-4 text-sm font-bold text-white shadow-lg",
              cls,
            )}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
              <Icon className="size-4" />
            </span>
            {label}
          </a>
        ))}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "بستن راه‌های ارتباطی" : "راه‌های ارتباطی"}
        className="bg-primary text-primary-foreground shadow-primary/30 flex size-14 items-center justify-center rounded-full shadow-xl transition hover:scale-105"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toFaDigits } from "@/lib/format";

export type GalleryImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  caption?: string | null;
};

/** گالری اسکرین‌شات‌ها با lightbox و ناوبری کیبورد */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const current = index !== null ? images[index] : null;
  const go = (d: number) =>
    setIndex((i) => (i === null ? i : (i + d + images.length) % images.length));

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.url}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group bg-card block w-full overflow-hidden rounded-2xl border text-start"
            >
              <Image
                src={img.url}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {img.caption && (
                <span className="text-muted-foreground block p-3 text-sm">{img.caption}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={index !== null} onOpenChange={(o) => !o && setIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[min(96vw,1200px)] border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,1200px)]"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") go(1);
            if (e.key === "ArrowRight") go(-1);
          }}
        >
          <DialogTitle className="sr-only">{current?.alt ?? "تصویر"}</DialogTitle>
          {current && (
            <figure className="relative">
              <Image
                src={current.url}
                alt={current.alt}
                width={current.width}
                height={current.height}
                className="max-h-[85vh] w-full rounded-xl object-contain"
                sizes="96vw"
              />
              <figcaption className="mt-3 flex items-center justify-between text-sm text-white">
                <span>{current.caption}</span>
                <span>
                  {toFaDigits(index! + 1)} از {toFaDigits(images.length)}
                </span>
              </figcaption>
              <div className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-between">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="rounded-full bg-black/50 p-2 text-white"
                  aria-label="تصویر قبلی"
                >
                  <ChevronRight className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="rounded-full bg-black/50 p-2 text-white"
                  aria-label="تصویر بعدی"
                >
                  <ChevronLeft className="size-6" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIndex(null)}
                className="absolute end-2 top-2 rounded-full bg-black/50 p-2 text-white"
                aria-label="بستن"
              >
                <X className="size-5" />
              </button>
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

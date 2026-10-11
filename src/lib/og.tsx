import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { visualWord } from "./reshape";

export const OG_SIZE = { width: 1200, height: 630 };

let fonts: Promise<Array<{ name: string; data: Buffer; weight: 400 | 700; style: "normal" }>> | null = null;
function loadFonts() {
  const dir = path.join(process.cwd(), "src/fonts/og");
  fonts ??= Promise.all([
    readFile(path.join(dir, "Vazirmatn-Bold.ttf")).then((data) => ({ name: "Vazirmatn", data, weight: 700 as const, style: "normal" as const })),
    readFile(path.join(dir, "Vazirmatn-Regular.ttf")).then((data) => ({ name: "Vazirmatn", data, weight: 400 as const, style: "normal" as const })),
  ]);
  return fonts;
}

/**
 * Satori متن راست‌به‌چپ را درست نمی‌چیند: کلمات را خودمان شکل‌دهی (reshape) و معکوس می‌کنیم
 * و با row-reverse از راست می‌چینیم تا شکستن خط هم درست باشد.
 */
function RtlText({ text, style, gap }: { text: string; style: Record<string, string | number>; gap: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "flex-start", ...style }}>
      {text.split(/\s+/).filter(Boolean).map((w, i) => (
        <span key={i} style={{ marginLeft: gap }}>{visualWord(w)}</span>
      ))}
    </div>
  );
}

/** تصویر اشتراک‌گذاری ۱۲۰۰×۶۳۰ با گرادیان رنگ برند/صنف و متن فارسی راست‌چین */
export async function renderOg({ eyebrow, title, subtitle, from = "#4f46e5", to = "#7c3aed", fg = "#ffffff" }: { eyebrow?: string; title: string; subtitle?: string; from?: string; to?: string; fg?: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: `linear-gradient(135deg, ${from}, ${to})`, color: fg, fontFamily: "Vazirmatn", direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>AvinApps</div>
          {eyebrow ? <RtlText text={eyebrow} gap={8} style={{ fontSize: 26, padding: "8px 22px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }} /> : <div style={{ display: "flex" }} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <RtlText text={title} gap={16} style={{ fontSize: title.length > 60 ? 50 : 62, fontWeight: 700, lineHeight: 1.45, maxWidth: 1056 }} />
          {subtitle ? <RtlText text={subtitle.length > 140 ? `${subtitle.slice(0, 137)}…` : subtitle} gap={8} style={{ marginTop: 20, fontSize: 28, opacity: 0.9, lineHeight: 1.6, maxWidth: 1000 }} /> : null}
        </div>
        <div style={{ display: "flex", fontSize: 24, opacity: 0.85 }}>avinapps.ir</div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}

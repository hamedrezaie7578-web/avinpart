"use server";

import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { CONFIG_KEYS, clearConfigCache, type ConfigKey } from "@/lib/secrets";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";
import { invalidate } from "@/server/admin/revalidate";

const TEXT_KEYS = [
  "site.name", "site.nameFa", "site.tagline",
  "contact.phone", "contact.mobile", "contact.email", "contact.address", "contact.workingHours",
  "social.whatsapp", "social.telegram", "social.instagram", "social.linkedin", "social.aparat",
  "trust.enamadHtml", "trust.samandehiHtml",
] as const;
const NUMBER_KEYS = ["stats.customers", "stats.years", "stats.satisfaction", "stats.industries", "billing.taxPercent"] as const;

async function put(key: string, value: unknown, isSecret = false) {
  await db.setting.upsert({ where: { key }, create: { key, value: value as never, isSecret }, update: { value: value as never, isSecret } });
}

export async function saveGeneralSettings(f: FormData) {
  return adminAction("settings.write", async (admin) => {
    const changes: Record<string, unknown> = {};
    for (const k of TEXT_KEYS) {
      // کد نماد اعتماد فقط از مدیر کل/تنظیمات معتبر می‌آید؛ طول محدود
      changes[k] = fd.str(f, k, { max: k.startsWith("trust.") ? 3000 : 300 });
    }
    for (const k of NUMBER_KEYS) changes[k] = fd.int(f, k, { min: 0 }) ?? 0;
    if ((changes["billing.taxPercent"] as number) > 30) throw new ActionError("درصد مالیات نامعتبر است.");
    changes["site.maintenance"] = fd.bool(f, "site.maintenance");
    await db.$transaction(Object.entries(changes).map(([key, value]) => db.setting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } })));
    await audit(admin.id, "settings.general", "Setting", null, changes);
    invalidate.settings();
    revalidateTag("redirects");
    return { ok: true, message: "تنظیمات ذخیره شد." };
  });
}

/** ذخیره‌ی تنظیمات سرویس‌ها؛ مقادیر محرمانه رمزنگاری می‌شوند و فیلد خالی یعنی «بدون تغییر» */
export async function saveIntegrations(f: FormData) {
  return adminAction("settings.write", async (admin) => {
    const changed: string[] = [];
    for (const [key, meta] of Object.entries(CONFIG_KEYS) as Array<[ConfigKey, (typeof CONFIG_KEYS)[ConfigKey]]>) {
      const v = fd.str(f, key, { max: 300 });
      if (f.get(`${key}__clear`) === "on") {
        await db.setting.deleteMany({ where: { key } });
        changed.push(`${key} (حذف)`);
        continue;
      }
      if (meta.secret) {
        if (!v) continue;
        await put(key, encrypt(v), true);
      } else {
        await put(key, v);
      }
      changed.push(key);
    }
    if ((await db.setting.findUnique({ where: { key: "payment.gateway" } }))?.value === "zarinpal") {
      const m = await db.setting.findUnique({ where: { key: "payment.zarinpal.merchant" } });
      if (!m && !process.env.ZARINPAL_MERCHANT_ID) throw new ActionError("برای فعال‌سازی زرین‌پال، مرچنت‌کد را وارد کنید.");
    }
    clearConfigCache();
    await audit(admin.id, "settings.integrations", "Setting", null, { changed }); // مقادیر محرمانه لاگ نمی‌شوند
    return { ok: true, message: "تنظیمات سرویس‌ها ذخیره شد." };
  });
}

export async function saveSeoSettings(f: FormData) {
  return adminAction("seo.write", async (admin) => {
    const data = {
      "seo.defaultTitle": fd.str(f, "defaultTitle", { max: 90 }),
      "seo.defaultDescription": fd.str(f, "defaultDescription", { max: 200 }),
      "seo.googleSiteVerification": fd.str(f, "googleSiteVerification", { max: 100 }),
      "seo.googleAnalyticsId": fd.str(f, "googleAnalyticsId", { max: 20 }).toUpperCase(),
      "seo.robotsExtra": fd.str(f, "robotsExtra", { max: 2000 }),
    };
    if (data["seo.googleAnalyticsId"] && !/^G-[A-Z0-9]{4,12}$/.test(data["seo.googleAnalyticsId"])) throw new ActionError("شناسه‌ی Google Analytics باید به شکل G-XXXXXXX باشد.");
    await db.$transaction(Object.entries(data).map(([key, value]) => db.setting.upsert({ where: { key }, create: { key, value }, update: { value } })));
    await audit(admin.id, "seo.settings", "Setting", null, data);
    invalidate.settings();
    return { ok: true, message: "تنظیمات سئو ذخیره شد." };
  });
}

function normPath(p: string) {
  const v = p.trim();
  if (!v.startsWith("/")) throw new ActionError("آدرس مبدأ باید با / شروع شود.");
  return decodeURIComponent(v).replace(/\/+$/, "") || "/";
}

export async function saveRedirect(id: string | null, f: FormData) {
  return adminAction("seo.write", async (admin) => {
    const from = normPath(fd.str(f, "from", { required: "آدرس مبدأ را وارد کنید." }));
    if (/^\/(admin|api|_next|dashboard)/.test(from)) throw new ActionError("این مسیر قابل ریدایرکت نیست.");
    const to = fd.str(f, "to", { required: "آدرس مقصد را وارد کنید." });
    if (!/^(\/|https?:\/\/)/.test(to)) throw new ActionError("مقصد باید با / یا https:// شروع شود.");
    if (to === from) throw new ActionError("مبدأ و مقصد یکسان است.");
    const code = fd.str(f, "code") === "302" ? 302 : 301;
    const r = id ? await db.redirect.update({ where: { id }, data: { from, to, code } }) : await db.redirect.create({ data: { from, to, code } });
    await audit(admin.id, id ? "redirect.update" : "redirect.create", "Redirect", r.id, { from, to, code });
    revalidateTag("redirects");
    return { ok: true, message: "ریدایرکت ذخیره شد (حداکثر تا یک دقیقه اعمال می‌شود)." };
  });
}

export async function deleteRedirect(id: string) {
  return adminAction("seo.write", async (admin) => {
    await db.redirect.delete({ where: { id } });
    await audit(admin.id, "redirect.delete", "Redirect", id);
    revalidateTag("redirects");
    return { ok: true, message: "حذف شد." };
  });
}

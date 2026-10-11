"use server";

import { db } from "@/lib/db";
import { getStorage, makeKey } from "@/lib/storage";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

const ALLOWED = [".exe", ".msi", ".zip", ".apk", ".aab"];

/** انتشار نسخه‌ی جدید با آپلود فایل نصب (ذخیره‌ی خصوصی؛ دانلود فقط از مسیر محافظت‌شده) */
export async function createRelease(f: FormData) {
  return adminAction("releases.write", async (admin) => {
    const platform = fd.str(f, "platform") as "WINDOWS" | "ANDROID" | "WEB" | "IOS";
    if (!["WINDOWS", "ANDROID", "WEB", "IOS"].includes(platform)) throw new ActionError("پلتفرم نامعتبر است.");
    const version = fd.str(f, "version", { required: "شماره‌ی نسخه را وارد کنید." });
    if (!/^\d+\.\d+(\.\d+)?([-.][\w.]+)?$/.test(version)) throw new ActionError("فرمت نسخه مثل 2.4.1 باشد.");
    const productId = fd.opt(f, "productId");
    const file = f.get("file");
    let fileId: string | null = null;
    if (file instanceof File && file.size > 0) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!ALLOWED.includes(ext)) throw new ActionError(`پسوند فایل مجاز نیست (${ALLOWED.join("، ")}).`);
      const key = makeKey("releases", file.name);
      await getStorage().put(key, Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream");
      const media = await db.media.create({ data: { path: key, url: "", mime: file.type || "application/octet-stream", size: file.size, alt: file.name, isPrivate: true, uploadedById: admin.id } });
      fileId = media.id;
    } else if (platform !== "WEB") throw new ActionError("فایل نصب را انتخاب کنید.");
    const r = await db.release.create({
      data: { platform, version, productId, changelog: fd.str(f, "changelog"), fileId, isMandatory: fd.bool(f, "isMandatory"), isDemo: fd.bool(f, "isDemo"), isPublished: fd.bool(f, "isPublished") },
    });
    await audit(admin.id, "release.create", "Release", r.id, { platform, version, productId });
    return { ok: true, message: "نسخه منتشر شد." };
  });
}

export async function toggleRelease(id: string, field: "isPublished" | "isMandatory") {
  return adminAction("releases.write", async (admin) => {
    const r = await db.release.findUniqueOrThrow({ where: { id } });
    await db.release.update({ where: { id }, data: { [field]: !r[field] } });
    await audit(admin.id, `release.toggle_${field}`, "Release", id);
    return { ok: true, message: "به‌روزرسانی شد." };
  });
}

export async function deleteRelease(id: string) {
  return adminAction("releases.write", async (admin) => {
    const r = await db.release.delete({ where: { id }, include: { file: true } });
    if (r.file) {
      await getStorage().delete(r.file.path);
      await db.media.delete({ where: { id: r.file.id } }).catch(() => {});
    }
    await audit(admin.id, "release.delete", "Release", id);
    return { ok: true, message: "حذف شد." };
  });
}

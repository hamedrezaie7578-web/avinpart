import "server-only";
import sharp from "sharp";
import { db } from "@/lib/db";
import { getStorage, makeKey } from "@/lib/storage";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * پردازش و ذخیره‌ی تصویر عمومی: تبدیل خودکار به WebP، محدود کردن ابعاد،
 * حذف متادیتا (EXIF/GPS) و ثبت در کتابخانه‌ی رسانه.
 */
export async function saveImage(file: File, opts: { alt?: string; uploadedById?: string; maxWidth?: number } = {}) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error(`فرمت «${file.name}» پشتیبانی نمی‌شود (JPG، PNG، WebP، GIF، AVIF).`);
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`حجم «${file.name}» بیش از ۱۵ مگابایت است.`);
  const input = Buffer.from(await file.arrayBuffer());
  const img = sharp(input, { animated: file.type === "image/gif" }).rotate();
  const out = await img.resize({ width: opts.maxWidth ?? 2400, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const key = makeKey("media", file.name.replace(/\.[^.]+$/, "") + ".webp");
  await getStorage().put(key, out.data, "image/webp");
  return db.media.create({
    data: {
      path: key,
      url: `/media/${key.replace(/^media\//, "")}`,
      mime: "image/webp",
      size: out.info.size,
      width: out.info.width,
      height: out.info.height,
      alt: opts.alt ?? file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      isPrivate: false,
      uploadedById: opts.uploadedById,
    },
  });
}

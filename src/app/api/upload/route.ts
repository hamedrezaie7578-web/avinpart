import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { ATTACHMENT_RULES, getStorage, makeKey, sniffMatches } from "@/lib/storage";

/**
 * آپلود پیوست‌های کاربر (فرم سفارش اختصاصی). فایل‌ها خصوصی ذخیره می‌شوند
 * و فقط از پنل مدیریت/کاربری قابل دریافت‌اند.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rl = await rateLimit(`upload:${ip}`, 20, 3600);
  if (!rl.ok)
    return NextResponse.json(
      { error: "تعداد آپلودها بیش از حد مجاز است؛ کمی بعد تلاش کنید." },
      { status: 429 },
    );

  const form = await req.formData().catch(() => null);
  const files = form?.getAll("files").filter((f): f is File => f instanceof File) ?? [];
  if (!files.length) return NextResponse.json({ error: "فایلی ارسال نشده است." }, { status: 400 });
  if (files.length > ATTACHMENT_RULES.maxFiles)
    return NextResponse.json(
      { error: `حداکثر ${ATTACHMENT_RULES.maxFiles} فایل مجاز است.` },
      { status: 400 },
    );

  const storage = getStorage();
  const out: Array<{ id: string; name: string; size: number }> = [];
  for (const f of files) {
    const exts = ATTACHMENT_RULES.types.get(f.type);
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (!exts || !exts.includes(ext))
      return NextResponse.json({ error: `نوع فایل «${f.name}» مجاز نیست.` }, { status: 415 });
    if (f.size > ATTACHMENT_RULES.maxBytes)
      return NextResponse.json(
        { error: `حجم «${f.name}» بیش از ۱۰ مگابایت است.` },
        { status: 413 },
      );
    const buf = Buffer.from(await f.arrayBuffer());
    if (!sniffMatches(buf, f.type))
      return NextResponse.json(
        { error: `محتوای فایل «${f.name}» با نوع آن همخوانی ندارد.` },
        { status: 415 },
      );
    const key = makeKey("custom-orders", f.name);
    await storage.put(key, buf, f.type);
    const media = await db.media.create({
      data: {
        path: key,
        url: "",
        mime: f.type,
        size: f.size,
        alt: f.name.slice(0, 200),
        isPrivate: true,
      },
    });
    out.push({ id: media.id, name: f.name, size: f.size });
  }
  return NextResponse.json({ files: out });
}

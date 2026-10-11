import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isCronAuthorized } from "@/server/cron-auth";

/** باطل‌کردن کامل کش صفحات (پس از استقرار یا بازیابی پشتیبان) */
export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  for (const t of ["products", "plans", "settings", "menus", "pages", "content", "posts", "redirects"]) revalidateTag(t);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

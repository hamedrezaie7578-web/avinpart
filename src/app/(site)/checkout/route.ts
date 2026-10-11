import { SITE_URL } from "@/lib/site";
import { NextResponse, type NextRequest } from "next/server";
import { addToCart } from "@/server/actions/cart";

/**
 * لینک‌های «خرید» در لندینگ‌ها و صفحه‌ی قیمت‌ها به اینجا می‌آیند:
 * /checkout?product=avingold&plan=ONLINE → افزودن به سبد و انتقال به /cart
 * /checkout?plan=ONLINE (بدون محصول) → انتخاب محصول
 */
export async function GET(req: NextRequest) {
  const product = req.nextUrl.searchParams.get("product");
  const plan = req.nextUrl.searchParams.get("plan") ?? "ONLINE";
  if (!product)
    return NextResponse.redirect(
      new URL(`/cart/choose?plan=${encodeURIComponent(plan)}`, SITE_URL),
    );
  const r = await addToCart(product, plan);
  const url = new URL("/cart", SITE_URL);
  if (!r.ok) url.searchParams.set("error", r.message);
  return NextResponse.redirect(url);
}

import { createPublicKey } from "node:crypto";
import { NextResponse } from "next/server";

/** کلید عمومی Ed25519 (PEM) برای توسعه‌دهندگان نرم‌افزارهای دسکتاپ و اندروید */
export function GET() {
  const pub = process.env.LICENSE_PUBLIC_KEY;
  if (!pub) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const pem = createPublicKey({
    key: Buffer.from(pub, "base64"),
    format: "der",
    type: "spki",
  }).export({ format: "pem", type: "spki" });
  return new NextResponse(pem, {
    headers: { "Content-Type": "application/x-pem-file", "Cache-Control": "public, max-age=86400" },
  });
}

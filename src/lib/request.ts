import "server-only";
import { headers } from "next/headers";

/** IP کاربر از هدرهای پراکسی (nginx) */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

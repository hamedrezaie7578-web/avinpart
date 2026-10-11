import {
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";

/**
 * کلید لایسنس با فرمت AVIN-XXXXX-XXXXX-XXXXX-XXXXX
 * الفبای Crockford Base32 بدون حروف مبهم (I, L, O, U) برای خوانایی هنگام تایپ دستی.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateLicenseKey(): string {
  const bytes = randomBytes(20);
  const chars = Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
  return `AVIN-${chars.slice(0, 5)}-${chars.slice(5, 10)}-${chars.slice(10, 15)}-${chars.slice(15, 20)}`;
}

export function isLicenseKeyFormat(key: string): boolean {
  return /^AVIN(-[0-9A-HJKMNP-TV-Z]{5}){4}$/.test(key);
}

/** نرمال‌سازی ورودی کاربر: حروف بزرگ، حذف فاصله و تبدیل O→0 و I/L→1 */
export function normalizeLicenseKey(input: string): string {
  const k = input.trim().toUpperCase().replace(/\s+/g, "");
  const body = k.startsWith("AVIN") ? k.slice(4) : k;
  return "AVIN" + body.replace(/O/g, "0").replace(/[IL]/g, "1");
}

let privateKey: KeyObject | null = null;
let publicKey: KeyObject | null = null;

function keys() {
  if (!privateKey || !publicKey) {
    const priv = process.env.LICENSE_PRIVATE_KEY;
    const pub = process.env.LICENSE_PUBLIC_KEY;
    if (!priv || !pub)
      throw new Error(
        "LICENSE_PRIVATE_KEY / LICENSE_PUBLIC_KEY تنظیم نشده‌اند (npm run license:keys)",
      );
    privateKey = createPrivateKey({
      key: Buffer.from(priv, "base64"),
      format: "der",
      type: "pkcs8",
    });
    publicKey = createPublicKey({ key: Buffer.from(pub, "base64"), format: "der", type: "spki" });
  }
  return { privateKey, publicKey };
}

/** JSON پایدار (کلیدها مرتب) تا امضا در کلاینت قابل بازتولید باشد */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * امضای Ed25519 پاسخ لایسنس. نرم‌افزار دسکتاپ و اندروید با کلید عمومی (جاسازی‌شده در برنامه)
 * امضا را بررسی می‌کند و تا validUntil می‌تواند آفلاین کار کند.
 */
export function signLicensePayload<T extends object>(
  payload: T,
): { payload: T; signature: string } {
  const sig = sign(null, Buffer.from(canonicalJson(payload)), keys().privateKey);
  return { payload, signature: sig.toString("base64") };
}

export function verifyLicenseSignature(payload: object, signature: string): boolean {
  return verify(
    null,
    Buffer.from(canonicalJson(payload)),
    keys().publicKey,
    Buffer.from(signature, "base64"),
  );
}

/** مدت اعتبار آفلاین پاسخ امضاشده (روز) */
export const OFFLINE_GRACE_DAYS = 30;

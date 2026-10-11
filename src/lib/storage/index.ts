import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AwsClient } from "aws4fetch";

/**
 * لایه‌ی Adapter ذخیره‌سازی فایل.
 * درایور محلی (پیش‌فرض) یا S3-compatible مثل آروان‌کلاد با STORAGE_DRIVER=s3.
 */
export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** آدرس عمومی برای فایل‌های public؛ فایل‌های خصوصی از طریق API امن سرو می‌شوند */
  publicUrl(key: string): string;
  /** لینک موقت مستقیم (فقط S3) برای دانلود فایل‌های حجیم بدون عبور از سرور برنامه */
  signedUrl?(key: string, seconds: number, downloadName?: string): Promise<string>;
}

class LocalDriver implements StorageDriver {
  constructor(private root: string) {}
  private resolve(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(path.resolve(this.root) + path.sep)) throw new Error("مسیر فایل نامعتبر است");
    return p;
  }
  async put(key: string, data: Buffer) {
    const p = this.resolve(key);
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, data);
  }
  get(key: string) {
    return readFile(this.resolve(key));
  }
  async delete(key: string) {
    await unlink(this.resolve(key)).catch(() => {});
  }
  publicUrl(key: string) {
    return `/api/files/${key}`;
  }
}

/** ذخیره‌سازی S3-compatible (آروان‌کلاد، MinIO، …) با امضای SigV4؛ همه‌ی فایل‌ها private ذخیره و از طریق برنامه سرو می‌شوند */
class S3Driver implements StorageDriver {
  private client: AwsClient;
  constructor(
    private endpoint: string,
    private bucket: string,
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
  ) {
    this.client = new AwsClient({ accessKeyId, secretAccessKey, region, service: "s3" });
  }
  private url(key: string) {
    if (key.includes("..")) throw new Error("مسیر فایل نامعتبر است");
    return `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
  async put(key: string, data: Buffer, contentType: string) {
    const r = await this.client.fetch(this.url(key), { method: "PUT", body: new Uint8Array(data), headers: { "Content-Type": contentType } });
    if (!r.ok) throw new Error(`S3 put failed: ${r.status} ${await r.text().catch(() => "")}`);
  }
  async get(key: string) {
    const r = await this.client.fetch(this.url(key));
    if (!r.ok) throw new Error(`S3 get failed: ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  async delete(key: string) {
    await this.client.fetch(this.url(key), { method: "DELETE" }).catch(() => {});
  }
  publicUrl(key: string) {
    return `/api/files/${key}`;
  }
  async signedUrl(key: string, seconds: number, downloadName?: string) {
    const u = new URL(this.url(key));
    u.searchParams.set("X-Amz-Expires", String(seconds));
    if (downloadName) u.searchParams.set("response-content-disposition", `attachment; filename="${downloadName}"`);
    const signed = await this.client.sign(u.toString(), { method: "GET", aws: { signQuery: true } });
    return signed.url;
  }
}

let driver: StorageDriver | null = null;
export function getStorage(): StorageDriver {
  if (driver) return driver;
  const e = process.env;
  if (e.STORAGE_DRIVER === "s3") {
    if (!e.S3_ENDPOINT || !e.S3_BUCKET || !e.S3_ACCESS_KEY || !e.S3_SECRET_KEY) throw new Error("تنظیمات S3 ناقص است (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY)");
    driver = new S3Driver(e.S3_ENDPOINT, e.S3_BUCKET, e.S3_ACCESS_KEY, e.S3_SECRET_KEY, e.S3_REGION || "ir-thr-at1");
  } else {
    driver = new LocalDriver(e.STORAGE_LOCAL_DIR || "./storage");
  }
  return driver;
}

/** ساخت کلید یکتا با حفظ پسوند امن */
export function makeKey(folder: string, originalName: string): string {
  const ext = path
    .extname(originalName)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "")
    .slice(0, 8);
  const d = new Date();
  return `${folder}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${randomUUID()}${ext}`;
}

/** پسوندها و حجم مجاز برای پیوست‌های کاربران (سفارش اختصاصی و تیکت) */
export const ATTACHMENT_RULES = {
  maxBytes: 10 * 1024 * 1024,
  maxFiles: 5,
  types: new Map<string, string[]>([
    ["application/pdf", [".pdf"]],
    ["image/png", [".png"]],
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/webp", [".webp"]],
    ["application/zip", [".zip"]],
    ["application/x-zip-compressed", [".zip"]],
    ["application/msword", [".doc"]],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", [".docx"]],
    ["application/vnd.ms-excel", [".xls"]],
    ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [".xlsx"]],
    ["text/plain", [".txt"]],
  ]),
};

/** بررسی امضای ابتدایی فایل (magic bytes) برای جلوگیری از جعل نوع فایل */
export function sniffMatches(buf: Buffer, mime: string): boolean {
  const hex = buf.subarray(0, 8).toString("hex");
  if (mime === "application/pdf") return hex.startsWith("25504446");
  if (mime === "image/png") return hex.startsWith("89504e47");
  if (mime === "image/jpeg") return hex.startsWith("ffd8ff");
  if (mime === "image/webp") return buf.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime.includes("zip") || mime.includes("openxmlformats")) return hex.startsWith("504b0304");
  if (mime === "application/msword" || mime === "application/vnd.ms-excel")
    return hex.startsWith("d0cf11e0");
  if (mime === "text/plain") return !buf.subarray(0, 512).includes(0);
  return false;
}

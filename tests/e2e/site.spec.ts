import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const LOG = process.env.E2E_SERVER_LOG ?? "/tmp/next.log";
const ADMIN = { id: process.env.E2E_ADMIN_MOBILE ?? "09120000000", pass: process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe!2026" };

/** آخرین کد OTP ارسال‌شده به یک شماره از لاگ سرور (سرویس پیامک console) */
async function lastOtp(mobile: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const m = [...readFileSync(LOG, "utf8").matchAll(new RegExp(`OTP ${mobile}: (\\d{4,6})`, "g"))].at(-1);
    if (m) return m[1]!;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("OTP not found in server log");
}

async function customerLogin(page: Page, mobile: string) {
  await page.goto("/login?callbackUrl=/dashboard");
  await page.fill("#login-mobile", mobile);
  const before = readFileSync(LOG, "utf8").length;
  await page.locator('button[type="submit"]').first().click();
  await expect(page.locator("#login-code")).toBeVisible();
  let code = "";
  for (let i = 0; i < 20 && !code; i++) {
    const m = [...readFileSync(LOG, "utf8").slice(before).matchAll(new RegExp(`OTP ${mobile}: (\\d{4,6})`, "g"))].at(-1);
    code = m?.[1] ?? "";
    if (!code) await page.waitForTimeout(250);
  }
  await page.fill("#login-code", code || (await lastOtp(mobile)));
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/dashboard/);
}

test.describe("public site", () => {
  for (const [path, h1] of [
    ["/", /زبان صنف شما/],
    ["/products", /./],
    ["/avingold", /طلا/],
    ["/pricing", /./],
    ["/custom-software", /./],
    ["/website-design", /./],
    ["/blog", /وبلاگ/],
    ["/blog/moadian-system-guide", /سامانه مودیان/],
    ["/faq", /./],
    ["/about", /./],
  ] as const) {
    test(`renders ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(h1);
    });
  }

  test("unknown product returns 404", async ({ page }) => {
    const res = await page.goto("/avin-does-not-exist");
    expect(res?.status()).toBe(404);
  });

  test("seo endpoints", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /admin");
    const og = await request.get("/opengraph-image");
    expect(og.headers()["content-type"]).toContain("image/png");
  });

  test("protected areas redirect to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin-login/);
  });
});

test.describe("customer", () => {
  const mobile = `0912${String(Date.now()).slice(-7)}`;

  test("OTP login, ticket, reply and profile", async ({ page }) => {
    await customerLogin(page, mobile);
    await page.goto("/dashboard/tickets/new");
    await page.fill('input[name="subject"]', "مشکل در چاپ فاکتور");
    await page.fill('textarea[name="body"]', "هنگام چاپ فاکتور A5 لوگو نمایش داده نمی‌شود. لطفاً راهنمایی کنید.");
    await page.locator('form button[type="submit"]').last().click();
    await page.waitForURL(/\/dashboard\/tickets\/c[a-z0-9]+$/, { timeout: 20_000 });
    await expect(page.getByText("هنگام چاپ فاکتور A5")).toBeVisible();
    await page.locator("textarea").last().fill("تصویر خطا را پیوست کردم.");
    await page.locator('form button[type="submit"]').last().click();
    await expect(page.getByText("تصویر خطا را پیوست کردم.")).toBeVisible({ timeout: 15_000 });

    // ویرایش پروفایل (همان نشست؛ ارسال مجدد OTP تا پایان مهلت مجاز نیست)
    await page.goto("/dashboard/profile");
    await page.fill("#p-name", "مشتری آزمایشی");
    await page.getByRole("button", { name: "ذخیره‌ی تغییرات" }).click();
    await expect(page.getByRole("status")).toBeVisible();
  });
});

test.describe("admin", () => {
  test.describe.configure({ mode: "serial" });
  let admin: Page;

  // یک بار ورود؛ ورود مکرر با محدودیت ۵ تلاش در ۱۵ دقیقه مسدود می‌شود
  test.beforeAll(async ({ browser }) => {
    admin = await (await browser.newContext({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" })).newPage();
    await admin.goto("/admin-login");
    await admin.fill('input[name="identifier"]', ADMIN.id);
    await admin.fill('input[name="password"]', ADMIN.pass);
    await admin.click('button[type="submit"]');
    await admin.waitForURL(/\/admin(\?|$)/);
  });

  test("main modules load", async () => {
    for (const path of ["/admin", "/admin/orders", "/admin/products", "/admin/plans", "/admin/blog", "/admin/tickets", "/admin/custom-orders", "/admin/settings", "/admin/audit"]) {
      const res = await admin.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(admin.locator("h1").first()).toBeVisible();
    }
  });

  test("staff replies to the customer ticket", async () => {
    await admin.goto("/admin/tickets");
    await admin.locator("tbody tr").first().click();
    await admin.fill("#reply", "سلام؛ از تنظیمات چاپ، گزینه‌ی نمایش لوگو را فعال کنید.");
    await admin.getByRole("button", { name: "ارسال پاسخ" }).click();
    await expect(admin.getByText("از تنظیمات چاپ، گزینه‌ی نمایش لوگو")).toBeVisible({ timeout: 15_000 });
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/admin-login");
    await page.fill('input[name="identifier"]', "09129999999");
    await page.fill('input[name="password"]', "wrong-password-1");
    await page.click('button[type="submit"]');
    await expect(page.getByRole("alert")).toBeVisible();
  });
});

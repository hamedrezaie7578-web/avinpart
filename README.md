# AvinApps — وب‌سایت avinapps.ir

وب‌سایت فروش نرم‌افزارهای حسابداری و مدیریت کسب‌وکار **Avin** برای ۲۶ صنف، همراه با پنل مدیریت و پنل کاربری.
برنامه‌ی کامل پروژه در [`docs/PLAN.md`](docs/PLAN.md) است.

## فناوری‌ها

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · PostgreSQL · Prisma · Auth.js · Zod · Vitest · Playwright · Docker

## راه‌اندازی محیط توسعه

پیش‌نیاز: Node.js 22 و PostgreSQL 16 (یا Docker).

```bash
# ۱. نصب وابستگی‌ها
npm install

# ۲. تنظیم متغیرها
cp .env.example .env
# مقدار AUTH_SECRET و ENCRYPTION_KEY را با «openssl rand -base64 32» بسازید

# ۳. اجرای دیتابیس (اگر Postgres محلی ندارید)
docker compose up -d db

# ۴. ساخت جداول و ورود داده‌های اولیه
npx prisma migrate dev
npm run db:seed

# ۵. اجرا
npm run dev
```

سایت روی `http://localhost:3000` بالا می‌آید. صفحه‌ی `/design-system` پیش‌نمایش همه‌ی کامپوننت‌ها با تم هر صنف است (noindex).

## دستورها

| دستور | کاربرد |
|---|---|
| `npm run dev` | اجرای محیط توسعه |
| `npm run build` | ساخت نسخه‌ی production |
| `npm run lint` / `npm run typecheck` | بررسی کد |
| `npm test` | تست‌های واحد (Vitest) |
| `npm run test:e2e` | تست‌های End-to-End (Playwright) |
| `npm run db:seed` | ورود داده‌های اولیه (قابل اجرای مکرر) |
| `npm run db:studio` | مشاهده‌ی دیتابیس |

## داده‌های اولیه (Seed)

- ۲۶ محصول با پالت رنگی اختصاصی هر صنف (کنتراست همه با تست WCAG AA بررسی می‌شود)
- ۶ دسته‌بندی صنف، ۳ پلن و جدول مقایسه‌ی ۲۵ ردیفی
- نقش‌های مدیر کل، فروش، پشتیبانی و محتوا + کاربر ادمین (از `SEED_ADMIN_*` در `.env`)
- تنظیمات سایت، منوها، دپارتمان‌های پشتیبانی، قالب‌های پیامک و FAQ عمومی

> اجرای مجدد Seed، تغییراتی را که از پنل مدیریت داده‌اید بازنویسی نمی‌کند.
> دستور `npm run db:seed` کش داده‌ی Next (`.next/cache/fetch-cache`) را هم پاک می‌کند تا صفحات با داده‌ی جدید ساخته شوند.

### محتوای Seed

- محتوای کامل ۲۶ لندینگ (هرکدام ۱۲۰۰+ کلمه، ۱۲+ امکان تخصصی، ۹–۱۰ سؤال متداول) در `prisma/seed/content/landings/`
- صفحات درباره، قوانین، حریم خصوصی و بازگشت وجه در `prisma/seed/content/pages/` (متون حقوقی پیش‌نویس‌اند و باید پیش از انتشار بازبینی حقوقی شوند)
- نمونه‌کارها، نظرات و FAQ خدمات — همه با برچسب «نمونه» تا پیش از انتشار با موارد واقعی جایگزین شوند
- تست `tests/unit/landings.test.ts` حداقل‌های محتوایی هر لندینگ را بررسی می‌کند

## استقرار با Docker

```bash
cp .env.example .env   # و مقادیر production را تنظیم کنید
docker compose --profile full build
docker compose up -d db && docker compose --profile setup run --rm setup   # migrate + seed (بار اول)
docker compose --profile full up -d
```

راهنمای کامل (SSL، پشتیبان‌گیری، به‌روزرسانی، ذخیره‌سازی آروان و عیب‌یابی): [`docs/DEPLOY.md`](docs/DEPLOY.md)

## بخش‌های اصلی

| بخش | مسیر |
|---|---|
| سایت عمومی و ۲۶ لندینگ محصول | `/`، `/products`، `/{slug}` مثل `/avingold` |
| قیمت‌ها، نرم‌افزار اختصاصی (ویزارد ۶ مرحله‌ای)، طراحی سایت | `/pricing`، `/custom-software`، `/website-design` |
| وبلاگ | `/blog` |
| پنل مشتری (ورود با پیامک) | `/dashboard` |
| پنل مدیریت (۲۳ ماژول، Ctrl+K برای جست‌وجو) | `/admin` — ورود: `/admin-login` |
| API لایسنس نرم‌افزارهای دسکتاپ/موبایل | `POST /api/license/verify`، `POST /api/license/deactivate`، `GET /api/license/public-key` |

## امنیت

- رمز عبور مدیران با Argon2id، ورود دومرحله‌ای اختیاری (TOTP)، محدودیت نرخ ورود و OTP
- RBAC با مجوزهای جزئی برای هر ماژول و لاگ کامل فعالیت مدیران
- پاک‌سازی HTML ویرایشگرها، اعتبارسنجی همه‌ی ورودی‌ها با Zod، هدرهای CSP/HSTS
- کلیدهای درگاه و پیامک رمزنگاری‌شده (AES-256-GCM) در دیتابیس
- پاسخ API لایسنس با امضای Ed25519 و شناسه‌ی سخت‌افزاری hash‌شده

## ساختار سیستم تم صنف‌ها

هر محصول یک فیلد `theme` (JSON) دارد. کامپوننت `ProductThemeScope` آن را به CSS Variables تبدیل می‌کند و همه‌ی کلاس‌های `bg-brand`، `text-brand`، `bg-brand-surface` و `bg-brand-gradient` داخل آن رنگ همان صنف را می‌گیرند. نسخه‌ی حالت تاریک هر رنگ به‌صورت خودکار با کنتراست کافی ساخته می‌شود (`src/lib/theme.ts`).

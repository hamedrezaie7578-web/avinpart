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
| `npm run db:seed` | ورود داده‌های اولیه (قابل اجرای مکرر) |
| `npm run db:studio` | مشاهده‌ی دیتابیس |

## داده‌های اولیه (Seed)

- ۲۶ محصول با پالت رنگی اختصاصی هر صنف (کنتراست همه با تست WCAG AA بررسی می‌شود)
- ۶ دسته‌بندی صنف، ۳ پلن و جدول مقایسه‌ی ۲۵ ردیفی
- نقش‌های مدیر کل، فروش، پشتیبانی و محتوا + کاربر ادمین (از `SEED_ADMIN_*` در `.env`)
- تنظیمات سایت، منوها، دپارتمان‌های پشتیبانی، قالب‌های پیامک و FAQ عمومی

> اجرای مجدد Seed، تغییراتی را که از پنل مدیریت داده‌اید بازنویسی نمی‌کند.

## استقرار با Docker

```bash
cp .env.example .env   # و مقادیر production را تنظیم کنید
docker compose --profile full up -d --build
# فقط بار اول — Seed از روی سرور (پورت دیتابیس روی 127.0.0.1 باز است):
DATABASE_URL=postgresql://avin:avin@localhost:5432/avinapps npm run db:seed
```

راهنمای کامل استقرار روی سرور ایرانی (SSL، پشتیبان‌گیری، به‌روزرسانی) در فاز ۷ تکمیل می‌شود.

## ساختار سیستم تم صنف‌ها

هر محصول یک فیلد `theme` (JSON) دارد. کامپوننت `ProductThemeScope` آن را به CSS Variables تبدیل می‌کند و همه‌ی کلاس‌های `bg-brand`، `text-brand`، `bg-brand-surface` و `bg-brand-gradient` داخل آن رنگ همان صنف را می‌گیرند. نسخه‌ی حالت تاریک هر رنگ به‌صورت خودکار با کنتراست کافی ساخته می‌شود (`src/lib/theme.ts`).

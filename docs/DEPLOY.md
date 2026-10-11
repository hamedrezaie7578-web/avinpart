# راهنمای استقرار AvinApps روی سرور

این راهنما استقرار کامل سایت را روی یک سرور لینوکسی (مثلاً Ubuntu 24.04 در دیتاسنترهای داخلی یا آروان‌کلاد) با Docker شرح می‌دهد.

## ۱. پیش‌نیازها

- سرور با حداقل **۲ هسته‌ی CPU، ۴ گیگابایت رم و ۴۰ گیگابایت دیسک**
- دامنه‌ی `avinapps.ir` و `www.avinapps.ir` که رکورد A آن‌ها به IP سرور اشاره کند
- Docker Engine و Docker Compose v2:

```bash
curl -fsSL https://get.docker.com | sh
```

> اگر دسترسی به Docker Hub محدود است، در `/etc/docker/daemon.json` یک mirror تعریف کنید
> (مثلاً `{"registry-mirrors": ["https://docker.arvancloud.ir"]}`) و Docker را restart کنید.

## ۲. دریافت کد و تنظیم متغیرها

```bash
git clone <آدرس مخزن> /opt/avinapps && cd /opt/avinapps
cp .env.example .env
```

در `.env` حتماً این مقادیر را تنظیم کنید:

| متغیر | توضیح |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://avinapps.ir` (هنگام build در کد قرار می‌گیرد؛ پس از تغییر باید دوباره build کنید) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | `openssl rand -base64 32` — **پشتیبان بگیرید؛ بدون آن کلیدهای ذخیره‌شده در پنل قابل بازیابی نیستند** |
| `CRON_SECRET` | `openssl rand -hex 24` |
| `POSTGRES_PASSWORD` | رمز قوی برای دیتابیس |
| `LICENSE_PRIVATE_KEY` / `LICENSE_PUBLIC_KEY` | با `npm run license:keys` بسازید (یک بار؛ تغییر آن لایسنس‌های صادرشده را نامعتبر می‌کند) |
| `SEED_ADMIN_*` | موبایل، ایمیل و رمز ادمین اولیه |
| `ALLOW_MOCK_PAYMENT` | در سایت اصلی **حتماً** `false` |

کلیدهای درگاه زرین‌پال و کاوه‌نگار را می‌توانید در `.env` بگذارید یا بعداً از **پنل مدیریت ← تنظیمات ← درگاه پرداخت و پیامک** وارد کنید (رمزنگاری‌شده در دیتابیس ذخیره می‌شوند و بر env اولویت دارند).

## ۳. ساخت و اجرای اولیه

```bash
# ساخت ایمیج‌ها (build به دیتابیس نیاز ندارد)
docker compose --profile full build

# اجرای دیتابیس و ساخت جداول + داده‌های اولیه (فقط بار اول)
docker compose up -d db
docker compose --profile setup run --rm setup
```

## ۴. گواهی SSL (Let's Encrypt)

بار اول nginx هنوز گواهی ندارد؛ پس موقتاً فقط بلوک HTTP را فعال می‌کنیم:

```bash
# ۱. در docker/nginx.conf سه بلوک «listen 443» را کامنت کنید و در بلوک ۸۰، خط return 301 را
#    با «location / { proxy_pass http://avinapps_app; }» جایگزین کنید.
docker compose --profile full up -d

# ۲. صدور گواهی
docker compose --profile certbot run --rm certbot certonly --webroot -w /var/www/certbot \
  -d avinapps.ir -d www.avinapps.ir --email admin@avinapps.ir --agree-tos --no-eff-email

# ۳. فایل docker/nginx.conf را به حالت اصلی برگردانید و nginx را reload کنید
docker compose exec nginx nginx -s reload
```

تمدید خودکار گواهی (crontab سرور):

```cron
0 4 * * 1 cd /opt/avinapps && docker compose --profile certbot run --rm certbot renew -q && docker compose exec nginx nginx -s reload
```

## ۵. اجرای کامل

```bash
docker compose --profile full up -d
docker compose ps          # همه باید healthy/running باشند
curl -s https://avinapps.ir/api/health
```

سرویس‌ها:

| سرویس | نقش |
|---|---|
| `db` | PostgreSQL 16 (پورت فقط روی 127.0.0.1) |
| `app` | برنامه‌ی Next.js — هنگام شروع migrationها را اعمال و کش صفحات را بازسازی می‌کند |
| `nginx` | HTTPS، فشرده‌سازی، محدودیت نرخ API، کش فایل‌های استاتیک |
| `cron` | یادآوری تمدید (۹ صبح) و پشتیبان دیتابیس (۳:۳۰ بامداد) به وقت تهران |

پس از اولین ورود به `/admin-login`:
1. از **حساب من** رمز ادمین را عوض و **ورود دومرحله‌ای** را فعال کنید.
2. در **تنظیمات** اطلاعات تماس، نماد اعتماد و کلیدهای درگاه/پیامک را وارد کنید.
3. در **سئو** کد Search Console و Google Analytics را وارد کنید.
4. نظرات، نمونه‌کارها و آمارهای «نمونه» را با موارد واقعی جایگزین کنید.

## ۶. به‌روزرسانی نسخه

```bash
cd /opt/avinapps && git pull
docker compose --profile full build app
docker compose --profile full up -d app      # migrationهای جدید خودکار اعمال می‌شوند
# اگر محتوای seed جدیدی اضافه شده (مثلاً مقاله‌ی جدید):
docker compose --profile setup run --rm setup
```

## ۷. پشتیبان‌گیری و بازیابی

- پشتیبان خودکار روزانه در volume `storage` (مسیر `/app/storage/backups`) نگه داشته می‌شود؛ ۱۴ نسخه‌ی آخر (`BACKUP_KEEP`).
- از پنل: **لاگ و پشتیبان‌گیری ← پشتیبان‌گیری** (پشتیبان فوری و دانلود).
- **توصیه:** پشتیبان‌ها را روزانه به فضای دیگری (مثلاً Object Storage آروان) منتقل کنید:

```bash
docker run --rm -v avinapps_storage:/s alpine tar czf - -C /s . > storage-$(date +%F).tgz
```

بازیابی دیتابیس:

```bash
docker compose cp storage-backup.dump db:/tmp/b.dump   # یا فایل دانلودشده از پنل
docker compose exec db pg_restore --clean --if-exists -U avin -d avinapps /tmp/b.dump
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/revalidate  # از داخل کانتینر app
```

## ۸. ذخیره‌سازی فایل روی آروان (اختیاری)

برای نگهداری رسانه و فایل‌های نصب روی Object Storage:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
S3_REGION=ir-thr-at1
S3_BUCKET=avinapps
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

باکت را **خصوصی** بسازید؛ دانلود فایل‌های نصب با لینک موقت ۱۰ دقیقه‌ای انجام می‌شود. فایل‌های موجود در `storage` محلی را پیش از تغییر درایور به باکت منتقل کنید.

## ۹. عیب‌یابی

| مشکل | راه‌حل |
|---|---|
| `app` ری‌استارت می‌شود | `docker compose logs app` — معمولاً `DATABASE_URL` یا `AUTH_SECRET` |
| پیامک ارسال نمی‌شود | پنل ← اعلان‌ها ← گزارش ارسال؛ سرویس پیامک روی «کاوه‌نگار» باشد |
| پرداخت خطا می‌دهد | مرچنت‌کد و حالت Sandbox در پنل ← تنظیمات |
| تغییرات پنل در سایت دیده نمی‌شود | کش‌ها خودکار باطل می‌شوند؛ در صورت نیاز: `POST /api/cron/revalidate` |
| حالت تعمیر | پنل ← تنظیمات ← حالت تعمیر (مدیران واردشده سایت را عادی می‌بینند) |

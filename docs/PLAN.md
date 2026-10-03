# برنامه‌ی ساخت وب‌سایت AvinApps (avinapps.ir)

> وضعیت: **پیش‌نویس برای تأیید** — هیچ کدی هنوز نوشته نشده است. پس از تأیید، فاز ۱ شروع می‌شود.

---

## ۱. تصمیم‌های فنی (و دلیل هر کدام)

| حوزه | انتخاب | توضیح |
|---|---|---|
| فریم‌ورک | Next.js 15 (App Router) + TypeScript strict | طبق درخواست. Server Components پیش‌فرض، Server Actions برای فرم‌ها |
| استایل | Tailwind CSS v4 + shadcn/ui (نسخه‌ی سازگار با v4) + Framer Motion | توکن‌های رنگی با CSS Variables؛ Framer فقط در کامپوننت‌های کلاینتی کوچک (`LazyMotion` برای حجم کمتر) |
| دیتابیس | PostgreSQL 16 + Prisma 6 | |
| احراز هویت | Auth.js v5 — دو Provider از نوع Credentials: «موبایل + OTP» و «ایمیل/موبایل + رمز» (فقط ادمین) | Session از نوع JWT؛ نقش و مجوزها داخل توکن؛ 2FA اختیاری (TOTP) برای ادمین |
| پیامک | `SmsProvider` interface ← `KavenegarProvider` و `ConsoleProvider` (توسعه) | |
| پرداخت | `PaymentGateway` interface ← `ZarinpalGateway` (+ `MockGateway` برای توسعه و تست) | IDPay/پی‌پینگ بعداً فقط با یک کلاس جدید |
| ذخیره‌ی فایل | `StorageDriver` ← `LocalDriver` و `S3Driver` (آروان کلاد) | تبدیل تصویر به WebP با `sharp` |
| ویرایشگر | Tiptap (خروجی JSON در DB + رندر HTML سمت سرور) | |
| نمودار | Recharts (فقط در /admin، lazy-load) | |
| فرم | React Hook Form + Zod (اسکیمای مشترک کلاینت/سرور) | |
| تاریخ | `date-fns-jalali` | |
| اعداد | توابع `toFaDigits` و `formatPrice` (Intl با `fa-IR`) | قیمت‌ها در DB به **تومان** و نوع `Int`/`BigInt` |
| فونت | Vazirmatn variable — self-host از پکیج npm با `next/font/local` | بدون Google Fonts |
| تم | `next-themes` (تاریک/روشن) + تم رنگی هر صنف با `data-theme`/style inline روی wrapper لندینگ | |
| کش و rate limit | جدول `RateLimit` در Postgres (بدون نیاز به Redis)؛ قابل سوییچ به Redis | سرور ایرانی ساده‌تر |
| جست‌وجو | Postgres `ILIKE` + `pg_trgm` | کافی برای این حجم |
| تست | Vitest (منطق) + Playwright (ورود، خرید، سفارش اختصاصی) | |
| استقرار | Docker multi-stage (`output: "standalone"`) + docker-compose (app, postgres, nginx) | |

**تصمیم‌های ابهام‌دار که گرفتم:**
- قیمت‌ها به تومان ذخیره می‌شوند؛ تبدیل به ریال فقط هنگام ارسال به زرین‌پال.
- «قیمت اختصاصی هر محصول» به‌صورت override اختیاری روی قیمت سراسری پلن است (اگر خالی بود قیمت سراسری اعمال می‌شود).
- محتوای متنی لندینگ‌ها و مقالات در فایل‌های TypeScript داخل `prisma/seed/content/` نوشته می‌شوند و Seed آن‌ها را وارد DB می‌کند؛ پس از آن منبع حقیقت، دیتابیس و پنل ادمین است.
- تصاویر موکاپ/اسکرین‌شات در ابتدا به‌صورت SVG/تصاویر تولیدشده‌ی کدی (موکاپ UI نرم‌افزار با رنگ هر صنف) ساخته می‌شوند تا بعداً با اسکرین‌شات واقعی از کتابخانه‌ی رسانه جایگزین شوند.
- لایسنس: کلید با فرمت `AVIN-XXXXX-XXXXX-XXXXX-XXXXX`، پاسخ API با امضای **Ed25519** تا نرم‌افزار دسکتاپ بتواند پاسخ را آفلاین هم اعتبارسنجی کند.

---

## ۲. ساختار پوشه‌ها

```
avinpart/
├─ docker/                     # Dockerfile، nginx.conf، اسکریپت backup
├─ docker-compose.yml
├─ .env.example
├─ README.md                   # فارسی: نصب، توسعه، استقرار
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed/
│     ├─ index.ts
│     ├─ plans.ts  industries.ts  products.ts  roles.ts  settings.ts
│     └─ content/
│        ├─ landings/          # یک فایل برای هر محصول (avingold.ts, avinpharma.ts, …)
│        ├─ blog/              # ۱۰ مقاله
│        └─ pages/             # درباره ما، قوانین، حریم خصوصی، بازگشت وجه
├─ public/                     # فاوآیکون، لوگو، تصاویر ثابت
├─ src/
│  ├─ app/
│  │  ├─ (site)/               # سایت عمومی با Header/Footer
│  │  │  ├─ page.tsx                       # صفحه‌ی اصلی
│  │  │  ├─ products/page.tsx
│  │  │  ├─ [productSlug]/page.tsx         # لندینگ پویا (avingold, …)
│  │  │  ├─ [productSlug]/opengraph-image.tsx
│  │  │  ├─ pricing/  custom-software/  website-design/
│  │  │  ├─ blog/ (page, [slug], category/[slug], tag/[slug])
│  │  │  ├─ download/  about/  contact/  faq/  support/
│  │  │  ├─ terms/  privacy/  refund-policy/
│  │  │  ├─ cart/  checkout/  payment/callback/
│  │  │  └─ portfolio/[slug]/
│  │  ├─ (auth)/login/  (auth)/admin-login/
│  │  ├─ dashboard/            # پنل مشتری (layout مجزا)
│  │  │  ├─ page.tsx  licenses/  downloads/  invoices/[id]/
│  │  │  ├─ upgrade/  tickets/[id]/  projects/[id]/  profile/
│  │  ├─ admin/                # پنل مدیریت (layout مجزا با سایدبار)
│  │  │  ├─ page.tsx (داشبورد)
│  │  │  ├─ products/[id]/{general,theme,sections,features,gallery,faq,pricing,seo}
│  │  │  ├─ industries/  plans/  orders/  payments/  licenses/  releases/
│  │  │  ├─ custom-orders/ (kanban)  customers/  admins/  roles/
│  │  │  ├─ tickets/  blog/  pages/  home/  menus/  portfolio/
│  │  │  ├─ testimonials/  faqs/  media/  coupons/  forms/
│  │  │  ├─ notifications/  seo/  redirects/  settings/  reports/
│  │  │  └─ audit-log/  backups/
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/
│  │  │  ├─ license/verify/  license/activate/  license/deactivate/
│  │  │  ├─ payment/zarinpal/callback/
│  │  │  ├─ upload/  download/[releaseId]/ (لینک امضاشده)
│  │  │  ├─ admin/export/[entity]/ (Excel)
│  │  │  └─ cron/ (انتشار زمان‌بندی‌شده، انقضای لایسنس)
│  │  ├─ sitemap.ts  robots.ts  manifest.ts
│  │  ├─ not-found.tsx  error.tsx  global-error.tsx
│  │  └─ layout.tsx            # lang="fa" dir="rtl"، فونت، ThemeProvider
│  ├─ components/
│  │  ├─ ui/                   # shadcn (Button, Card, Dialog, …)
│  │  ├─ design-system/        # SectionHeader, FeatureGrid, PricingCard, PricingTable,
│  │  │                        # ComparisonTable, FAQ, Testimonial, StatCounter, DeviceMockup,
│  │  │                        # CTA, Breadcrumb, Lightbox, PlatformBadges, PriceTag
│  │  ├─ layout/               # Header, MegaMenu, MobileNav, Footer, FloatingContact, StickyMobileCTA
│  │  ├─ landing/sections/     # یک کامپوننت برای هر نوع سکشن (Hero, PainPoints, Features, …)
│  │  ├─ forms/                # DemoRequestForm, ContactForm, CustomOrderWizard, OtpLogin
│  │  ├─ seo/JsonLd.tsx
│  │  ├─ admin/                # DataTable, CommandPalette, SectionBuilder (dnd-kit),
│  │  │                        # ColorPicker, RichEditor (Tiptap), SeoScore, MediaPicker, Kanban
│  │  └─ dashboard/
│  ├─ lib/
│  │  ├─ db.ts  auth.ts  permissions.ts  rate-limit.ts  audit.ts
│  │  ├─ sms/ (provider.ts, kavenegar.ts, console.ts)
│  │  ├─ payment/ (gateway.ts, zarinpal.ts, mock.ts)
│  │  ├─ storage/ (driver.ts, local.ts, s3.ts, image.ts)
│  │  ├─ license/ (generate.ts, sign.ts)
│  │  ├─ pricing.ts            # قیمت نهایی = پلن/override/تخفیف/کوپن؛ محاسبه‌ی مابه‌التفاوت ارتقا
│  │  ├─ seo/ (metadata.ts, jsonld.ts, score.ts)
│  │  ├─ theme.ts              # پالت → CSS variables + بررسی کنتراست WCAG
│  │  ├─ format.ts             # اعداد فارسی، قیمت، تاریخ جلالی
│  │  └─ validations/          # اسکیماهای Zod
│  ├─ server/
│  │  ├─ queries/              # خواندن داده (cache + revalidateTag)
│  │  └─ actions/              # Server Actions (site, dashboard, admin)
│  ├─ styles/globals.css
│  ├─ fonts/                   # Vazirmatn woff2
│  └─ middleware.ts            # محافظت /admin و /dashboard، ریدایرکت‌های 301، حالت تعمیرات
├─ tests/ (unit/, e2e/)
└─ docs/PLAN.md
```

---

## ۳. اسکیمای Prisma (کامل)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

// ───────────── کاربران، نقش‌ها، احراز هویت ─────────────
enum UserType { CUSTOMER ADMIN }

model User {
  id            String    @id @default(cuid())
  type          UserType  @default(CUSTOMER)
  mobile        String    @unique
  email         String?   @unique
  name          String?
  passwordHash  String?               // فقط ادمین‌ها (argon2id)
  totpSecret    String?               // رمزنگاری‌شده (AES-GCM)
  totpEnabled   Boolean   @default(false)
  roleId        String?
  role          Role?     @relation(fields: [roleId], references: [id])
  isBlocked     Boolean   @default(false)
  businessName  String?
  businessType  String?
  nationalId    String?
  economicCode  String?
  city          String?
  address       String?
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  orders        Order[]
  licenses      License[]
  tickets       Ticket[]       @relation("TicketOwner")
  ticketReplies TicketMessage[]
  customOrders  CustomOrder[]  @relation("CustomOrderOwner")
  assignedCustomOrders CustomOrder[] @relation("CustomOrderAssignee")
  posts         Post[]
  auditLogs     AuditLog[]
  cart          Cart?
  @@index([type])
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique          // مدیر کل، فروش، پشتیبانی، محتوا
  description String?
  isSystem    Boolean  @default(false)  // مدیر کل قابل حذف نیست
  permissions String[]                  // مثل "products.read", "products.write", "orders.refund"
  users       User[]
}

model OtpCode {
  id        String   @id @default(cuid())
  mobile    String
  codeHash  String
  attempts  Int      @default(0)
  expiresAt DateTime
  usedAt    DateTime?
  ip        String?
  createdAt DateTime @default(now())
  @@index([mobile, createdAt])
}

model RateLimit {
  key       String   @id                // مثل "otp:09121234567" یا "login:ip"
  count     Int
  resetAt   DateTime
}

// ───────────── صنف‌ها و محصولات ─────────────
model IndustryCategory {           // خدماتی، فروشگاهی، تولیدی، پخش، درمانی …
  id         String     @id @default(cuid())
  name       String
  slug       String     @unique
  sortOrder  Int        @default(0)
  products   Product[]
}

enum PublishStatus { DRAFT PUBLISHED ARCHIVED }

model Product {
  id            String   @id @default(cuid())
  slug          String   @unique          // avingold
  name          String                    // AvinGold
  industryName  String                    // طلا و جواهر فروشی
  shortDesc     String
  icon          String                    // نام آیکون lucide
  logoId        String?
  logo          Media?   @relation("ProductLogo", fields: [logoId], references: [id])
  categoryId    String?
  category      IndustryCategory? @relation(fields: [categoryId], references: [id])
  theme         Json     // { primary, primaryFg, secondary, accent, background, surface, gradientFrom, gradientTo }
  status        PublishStatus @default(DRAFT)
  isFeatured    Boolean  @default(false)
  sortOrder     Int      @default(0)
  ratingValue   Float?   // برای aggregateRating
  ratingCount   Int?
  // SEO
  seoTitle       String?
  seoDescription String?
  focusKeyword   String?
  keywords       String[]
  ogImageId      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sections      LandingSection[]
  features      ProductFeature[]
  screenshots   ProductScreenshot[]
  faqs          Faq[]
  testimonials  Testimonial[]
  planPrices    ProductPlanPrice[]
  releases      Release[]
  licenses      License[]
  orderItems    OrderItem[]
  posts         Post[]   @relation("PostProducts")
  related       Product[] @relation("RelatedProducts")
  relatedOf     Product[] @relation("RelatedProducts")
}

enum SectionType {
  HERO PAIN_POINTS FEATURES MODULES PLATFORMS GALLERY PRICING
  STATS TESTIMONIALS VIDEO FAQ CTA RELATED RICH_TEXT
}

model LandingSection {             // Section builder
  id         String      @id @default(cuid())
  productId  String?               // null = صفحه‌ی اصلی یا صفحه‌ی ثابت
  product    Product?    @relation(fields: [productId], references: [id], onDelete: Cascade)
  pageId     String?
  page       Page?       @relation(fields: [pageId], references: [id], onDelete: Cascade)
  type       SectionType
  enabled    Boolean     @default(true)
  sortOrder  Int
  data       Json                    // محتوای سکشن؛ با Zod برای هر type اعتبارسنجی می‌شود
  @@index([productId, sortOrder])
  @@index([pageId, sortOrder])
}

model ProductFeature {
  id          String  @id @default(cuid())
  productId   String
  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  title       String
  description String
  icon        String
  isKey       Boolean @default(true)   // امکان کلیدی صنفی یا ماژول عمومی
  sortOrder   Int     @default(0)
}

model ProductScreenshot {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  mediaId   String
  media     Media   @relation(fields: [mediaId], references: [id])
  caption   String?
  platform  Platform?
  sortOrder Int     @default(0)
}

// ───────────── پلن‌ها و قیمت‌گذاری ─────────────
enum Platform { WINDOWS ANDROID WEB IOS }

model Plan {
  id            String   @id @default(cuid())
  code          String   @unique       // OFFLINE, ONLINE, ONLINE_SITE
  name          String
  tagline       String
  price         Int                    // تومان
  compareAtPrice Int?                  // قیمت خط‌خورده
  isPopular     Boolean  @default(false)
  platforms     Platform[]
  durationDays  Int?                   // null = دائمی؛ برای آنلاین مثلاً ۳۶۵ (تمدید)
  renewalPrice  Int?
  maxDevices    Int      @default(1)
  sortOrder     Int      @default(0)
  isActive      Boolean  @default(true)
  features      PlanFeatureValue[]
  productPrices ProductPlanPrice[]
  discounts     TimedDiscount[]
  orderItems    OrderItem[]
  licenses      License[]
}

model ComparisonFeature {          // سطرهای جدول مقایسه
  id        String  @id @default(cuid())
  group     String                   // «نسخه‌ها»، «همگام‌سازی»، «وب‌سایت» …
  title     String
  tooltip   String?
  sortOrder Int     @default(0)
  values    PlanFeatureValue[]
}

model PlanFeatureValue {
  planId    String
  plan      Plan              @relation(fields: [planId], references: [id], onDelete: Cascade)
  featureId String
  feature   ComparisonFeature @relation(fields: [featureId], references: [id], onDelete: Cascade)
  included  Boolean
  note      String?                   // مثلاً «تا ۵ کاربر»
  @@id([planId, featureId])
}

model ProductPlanPrice {           // قیمت اختصاصی هر محصول (override)
  productId      String
  product        Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  planId         String
  plan           Plan    @relation(fields: [planId], references: [id], onDelete: Cascade)
  price          Int?
  compareAtPrice Int?
  isAvailable    Boolean @default(true)
  @@id([productId, planId])
}

model TimedDiscount {
  id        String   @id @default(cuid())
  planId    String?
  plan      Plan?    @relation(fields: [planId], references: [id], onDelete: Cascade)
  productId String?
  percent   Int?
  amount    Int?
  label     String?                  // «جشنواره‌ی نوروز»
  startsAt  DateTime
  endsAt    DateTime
  isActive  Boolean  @default(true)
}

model Coupon {
  id          String   @id @default(cuid())
  code        String   @unique
  type        DiscountType
  value       Int
  maxUses     Int?
  usedCount   Int      @default(0)
  perUserLimit Int?    @default(1)
  minAmount   Int?
  productIds  String[]
  planIds     String[]
  startsAt    DateTime?
  endsAt      DateTime?
  isActive    Boolean  @default(true)
  orders      Order[]
}
enum DiscountType { PERCENT AMOUNT }

// ───────────── سبد، سفارش، پرداخت، فاکتور ─────────────
model Cart {
  id        String     @id @default(cuid())
  userId    String?    @unique
  user      User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  guestId   String?    @unique        // کوکی برای کاربر مهمان
  items     CartItem[]
  updatedAt DateTime   @updatedAt
}
model CartItem {
  id        String @id @default(cuid())
  cartId    String
  cart      Cart   @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  planId    String
  @@unique([cartId, productId, planId])
}

enum OrderStatus { PENDING PAID FAILED CANCELED REFUNDED }
enum OrderKind { PURCHASE UPGRADE RENEWAL }

model Order {
  id           String      @id @default(cuid())
  number       Int         @unique @default(autoincrement())   // شماره‌ی فاکتور
  userId       String
  user         User        @relation(fields: [userId], references: [id])
  kind         OrderKind   @default(PURCHASE)
  status       OrderStatus @default(PENDING)
  subtotal     Int
  discount     Int         @default(0)
  tax          Int         @default(0)   // ارزش افزوده (درصد از تنظیمات)
  total        Int
  couponId     String?
  coupon       Coupon?     @relation(fields: [couponId], references: [id])
  upgradeFromLicenseId String?
  note         String?
  paidAt       DateTime?
  createdAt    DateTime    @default(now())
  items        OrderItem[]
  payments     Payment[]
  @@index([status, createdAt])
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  planId    String
  plan      Plan    @relation(fields: [planId], references: [id])
  unitPrice Int
  title     String                    // اسنپ‌شات نام در لحظه‌ی خرید
  license   License?
}

enum PaymentStatus { INITIATED SUCCESS FAILED REFUNDED }

model Payment {
  id          String        @id @default(cuid())
  orderId     String
  order       Order         @relation(fields: [orderId], references: [id])
  gateway     String                  // zarinpal, idpay, mock
  amount      Int
  status      PaymentStatus @default(INITIATED)
  authority   String?       @unique
  refId       String?
  cardPan     String?
  raw         Json?
  createdAt   DateTime      @default(now())
  verifiedAt  DateTime?
}

// ───────────── لایسنس و نسخه‌ها ─────────────
enum LicenseStatus { ACTIVE SUSPENDED REVOKED EXPIRED }

model License {
  id          String        @id @default(cuid())
  key         String        @unique
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  productId   String
  product     Product       @relation(fields: [productId], references: [id])
  planId      String
  plan        Plan          @relation(fields: [planId], references: [id])
  orderItemId String?       @unique
  orderItem   OrderItem?    @relation(fields: [orderItemId], references: [id])
  status      LicenseStatus @default(ACTIVE)
  maxDevices  Int
  expiresAt   DateTime?
  webUrl      String?                 // لینک ورود نسخه‌ی وب
  note        String?
  createdAt   DateTime      @default(now())
  devices     LicenseDevice[]
  logs        LicenseLog[]
}
model LicenseDevice {
  id          String   @id @default(cuid())
  licenseId   String
  license     License  @relation(fields: [licenseId], references: [id], onDelete: Cascade)
  hardwareId  String                  // هش قفل سخت‌افزاری
  platform    Platform
  deviceName  String?
  activatedAt DateTime @default(now())
  lastSeenAt  DateTime @default(now())
  isActive    Boolean  @default(true)
  @@unique([licenseId, hardwareId])
}
model LicenseLog {
  id        String   @id @default(cuid())
  licenseId String
  license   License  @relation(fields: [licenseId], references: [id], onDelete: Cascade)
  action    String                    // verify, activate, deactivate, revoke, renew
  result    String                    // ok, denied:max_devices, …
  ip        String?
  hardwareId String?
  createdAt DateTime @default(now())
  @@index([licenseId, createdAt])
}

model Release {
  id          String   @id @default(cuid())
  productId   String?                 // null = نسخه‌ی عمومی (همه‌ی محصولات)
  product     Product? @relation(fields: [productId], references: [id])
  platform    Platform
  version     String
  changelog   String                  // markdown
  fileId      String?
  file        Media?   @relation(fields: [fileId], references: [id])
  isMandatory Boolean  @default(false)
  isDemo      Boolean  @default(false)  // نسخه‌ی دموی رایگان برای همه
  isPublished Boolean  @default(true)
  downloads   Int      @default(0)
  createdAt   DateTime @default(now())
  @@unique([productId, platform, version])
}

// ───────────── سفارش نرم‌افزار اختصاصی و طراحی سایت ─────────────
enum CustomOrderStatus { NEW REVIEWING QUOTE_SENT IN_DEVELOPMENT DELIVERED CANCELED }
enum CustomOrderType { CUSTOM_SOFTWARE WEBSITE }

model CustomOrder {
  id            String   @id @default(cuid())
  trackingCode  String   @unique      // مثل CS-140507-4821
  type          CustomOrderType @default(CUSTOM_SOFTWARE)
  userId        String?
  user          User?    @relation("CustomOrderOwner", fields: [userId], references: [id])
  contactName   String
  mobile        String
  email         String?
  businessName  String?
  businessField String?
  projectTypes  String[]               // ERP, CRM, android, web-app, integration
  platforms     Platform[]
  features      String[]               // چک‌لیست
  description   String
  budgetRange   String
  timeline      String
  status        CustomOrderStatus @default(NEW)
  boardOrder    Int      @default(0)   // ترتیب در ستون کانبان
  assigneeId    String?
  assignee      User?    @relation("CustomOrderAssignee", fields: [assigneeId], references: [id])
  quoteAmount   Int?
  quoteFileId   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  attachments   Media[]  @relation("CustomOrderFiles")
  notes         CustomOrderNote[]
  events        CustomOrderEvent[]     // تایم‌لاین قابل مشاهده برای مشتری
}
model CustomOrderNote {                 // یادداشت داخلی
  id        String   @id @default(cuid())
  orderId   String
  order     CustomOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  authorId  String
  body      String
  createdAt DateTime @default(now())
}
model CustomOrderEvent {
  id        String   @id @default(cuid())
  orderId   String
  order     CustomOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    CustomOrderStatus
  message   String?
  createdAt DateTime @default(now())
}

model PortfolioItem {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  client      String?
  summary     String
  body        Json?                    // Tiptap
  coverId     String?
  cover       Media?   @relation("PortfolioCover", fields: [coverId], references: [id])
  tags        String[]
  type        CustomOrderType
  isPublished Boolean  @default(true)
  sortOrder   Int      @default(0)
}

// ───────────── پشتیبانی ─────────────
enum TicketStatus { OPEN ANSWERED CUSTOMER_REPLY CLOSED }
enum TicketPriority { LOW NORMAL HIGH URGENT }

model Department { id String @id @default(cuid()); name String; tickets Ticket[] }

model Ticket {
  id           String         @id @default(cuid())
  number       Int            @unique @default(autoincrement())
  userId       String
  user         User           @relation("TicketOwner", fields: [userId], references: [id])
  departmentId String
  department   Department     @relation(fields: [departmentId], references: [id])
  subject      String
  status       TicketStatus   @default(OPEN)
  priority     TicketPriority @default(NORMAL)
  licenseId    String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  messages     TicketMessage[]
}
model TicketMessage {
  id          String   @id @default(cuid())
  ticketId    String
  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  body        String
  isStaff     Boolean  @default(false)
  attachments Media[]  @relation("TicketFiles")
  createdAt   DateTime @default(now())
}
model CannedReply { id String @id @default(cuid()); title String; body String }

// ───────────── محتوا: وبلاگ، صفحات، منوها، FAQ، نظرات ─────────────
model Post {
  id             String   @id @default(cuid())
  slug           String   @unique
  title          String
  excerpt        String
  content        Json                  // Tiptap JSON
  contentHtml    String                // رندر‌شده برای سرعت
  readingMinutes Int
  coverId        String?
  cover          Media?   @relation("PostCover", fields: [coverId], references: [id])
  authorId       String
  author         User     @relation(fields: [authorId], references: [id])
  categoryId     String?
  category       PostCategory? @relation(fields: [categoryId], references: [id])
  tags           Tag[]
  products       Product[] @relation("PostProducts")   // لینک‌سازی داخلی
  status         PublishStatus @default(DRAFT)
  publishAt      DateTime?             // انتشار زمان‌بندی‌شده
  seoTitle       String?
  seoDescription String?
  focusKeyword   String?
  seoScore       Int?
  views          Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@index([status, publishAt])
}
model PostCategory { id String @id @default(cuid()); name String; slug String @unique; description String?; posts Post[] }
model Tag          { id String @id @default(cuid()); name String; slug String @unique; posts Post[] }

model Page {                            // صفحه‌ی اصلی، درباره ما، قوانین، …
  id             String   @id @default(cuid())
  slug           String   @unique      // home, about, terms, privacy, refund-policy, website-design, custom-software
  title          String
  content        Json?
  sections       LandingSection[]
  seoTitle       String?
  seoDescription String?
  updatedAt      DateTime @updatedAt
}

model Faq {
  id        String   @id @default(cuid())
  productId String?                    // null = عمومی
  product   Product? @relation(fields: [productId], references: [id], onDelete: Cascade)
  group     String?                    // general, payment, license, custom
  question  String
  answer    String
  sortOrder Int      @default(0)
}

model Testimonial {
  id        String   @id @default(cuid())
  productId String?
  product   Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  name      String
  role      String                     // «مدیر طلافروشی … — تبریز»
  body      String
  rating    Int      @default(5)
  avatarId  String?
  isSample  Boolean  @default(true)    // برچسب «نمونه»
  isPublished Boolean @default(true)
  sortOrder Int      @default(0)
}

model Menu {
  id    String     @id @default(cuid())
  key   String     @unique             // header, footer-1, footer-2, mega
  items MenuItem[]
}
model MenuItem {
  id        String     @id @default(cuid())
  menuId    String
  menu      Menu       @relation(fields: [menuId], references: [id], onDelete: Cascade)
  parentId  String?
  parent    MenuItem?  @relation("MenuTree", fields: [parentId], references: [id], onDelete: Cascade)
  children  MenuItem[] @relation("MenuTree")
  label     String
  href      String
  icon      String?
  sortOrder Int        @default(0)
}

// ───────────── رسانه ─────────────
model Media {
  id        String   @id @default(cuid())
  path      String                     // مسیر داخل driver
  url       String
  mime      String
  size      Int
  width     Int?
  height    Int?
  alt       String?
  isPrivate Boolean  @default(false)   // فایل‌های نصب و پیوست‌ها
  uploadedById String?
  createdAt DateTime @default(now())
  // معکوس روابط
  productLogos   Product[]           @relation("ProductLogo")
  screenshots    ProductScreenshot[]
  releases       Release[]
  postCovers     Post[]              @relation("PostCover")
  portfolioCovers PortfolioItem[]    @relation("PortfolioCover")
  customOrders   CustomOrder[]       @relation("CustomOrderFiles")
  ticketMessages TicketMessage[]     @relation("TicketFiles")
}

// ───────────── فرم‌ها و اعلان‌ها ─────────────
enum LeadType { DEMO CONTACT CONSULT NEWSLETTER }
model Lead {
  id        String   @id @default(cuid())
  type      LeadType
  name      String?
  mobile    String?
  email     String?
  productId String?
  message   String?
  source    String?                    // URL صفحه + utm
  isHandled Boolean  @default(false)
  createdAt DateTime @default(now())
}

model NotificationTemplate {
  id       String  @id @default(cuid())
  key      String  @unique             // otp, order_paid, ticket_answered, custom_order_status …
  channel  String                      // sms | email
  subject  String?
  body     String                      // با متغیرهای {{name}}
  kavenegarTemplate String?            // برای Verify Lookup
  isActive Boolean @default(true)
}
model AdminNotification {               // اعلان‌های داخل پنل
  id        String   @id @default(cuid())
  type      String
  title     String
  href      String?
  readAt    DateTime?
  createdAt DateTime @default(now())
}
model SmsLog { id String @id @default(cuid()); mobile String; template String?; status String; provider String; createdAt DateTime @default(now()) }

// ───────────── تنظیمات، سئو، لاگ ─────────────
model Setting {                         // key/value با گروه
  key       String   @id               // site.name, contact.phone, payment.zarinpal.merchant, seo.gsc …
  value     Json
  isSecret  Boolean  @default(false)   // مقادیر حساس رمزنگاری‌شده
  updatedAt DateTime @updatedAt
}
model Redirect {
  id        String   @id @default(cuid())
  from      String   @unique
  to        String
  code      Int      @default(301)
  hits      Int      @default(0)
}
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String                     // product.update, order.refund …
  entity    String
  entityId  String?
  diff      Json?
  ip        String?
  createdAt DateTime @default(now())
  @@index([entity, entityId])
}
model Backup { id String @id @default(cuid()); file String; size Int; createdAt DateTime @default(now()) }
```

---

## ۴. فهرست مسیرها

### سایت عمومی
| مسیر | رندر | توضیح |
|---|---|---|
| `/` | ISR | هیرو، «صنف شما چیست؟»، مزایا، سه نسخه، پلن‌ها، نرم‌افزار اختصاصی، نظرات، مقالات، FAQ |
| `/products` | ISR | فیلتر دسته‌بندی + جست‌وجوی کلاینتی سبک |
| `/[productSlug]` | SSG + ISR (`generateStaticParams`) | لندینگ با تم صنف؛ ۲۶ صفحه |
| `/pricing` | ISR | پلن‌ها + جدول مقایسه + FAQ پرداخت |
| `/custom-software` | ISR | خدمات، تایم‌لاین، نمونه‌کار، Wizard ۶ مرحله‌ای |
| `/website-design` | ISR | مزایای کدنویسی اختصاصی در برابر وردپرس |
| `/portfolio/[slug]` | ISR | |
| `/blog`، `/blog/[slug]`، `/blog/category/[slug]`، `/blog/tag/[slug]` | ISR | |
| `/download` | ISR + بخش پویا | دموی رایگان برای همه؛ نسخه‌های کامل پس از ورود |
| `/about`، `/contact`، `/faq`، `/support`، `/terms`، `/privacy`، `/refund-policy` | ISR | |
| `/cart`، `/checkout`، `/payment/callback` | دینامیک | |
| `/login` | دینامیک | OTP |
| `/sitemap.xml`، `/robots.txt`، `/manifest.webmanifest` | دینامیک/کش | |

### پنل مشتری `/dashboard/*`
`/` خلاصه — `/licenses` (کلید، دستگاه‌ها، غیرفعال‌سازی دستگاه) — `/downloads` — `/invoices` و `/invoices/[id]` (نسخه‌ی چاپی/PDF با CSS print) — `/upgrade` — `/tickets` و `/tickets/[id]` — `/projects` و `/projects/[id]` (سفارش‌های اختصاصی) — `/profile`

### پنل مدیریت `/admin/*`
۲۳ ماژول طبق درخواست؛ هر ماژول با مجوز مشخص در `permissions.ts` (مثل `products.write`). صفحه‌ی ادمین‌لاگین جدا: `/admin-login`.

### API
`/api/auth/*` — `/api/license/verify|activate|deactivate` (POST، rate-limited، پاسخ امضاشده) — `/api/payment/zarinpal/callback` — `/api/upload` — `/api/download/[releaseId]` (توکن موقت) — `/api/admin/export/[entity]` (xlsx با `exceljs`) — `/api/cron/*` (با `CRON_SECRET`، اجرا از کانتینر cron یا crontab سرور)

---

## ۵. سیستم تم رنگی صنف‌ها

- هر محصول یک `theme` JSON دارد → تابع `themeToCssVars()` آن را به `--brand`, `--brand-fg`, `--brand-2`, `--brand-surface`, `--brand-gradient-*` تبدیل می‌کند و روی `<div data-product-theme style={…}>` لندینگ قرار می‌گیرد.
- Tailwind v4 با `@theme inline` رنگ‌هایی مثل `bg-brand`, `text-brand-fg` را به این متغیرها وصل می‌کند؛ پس همه‌ی کامپوننت‌های لندینگ یک‌بار نوشته می‌شوند.
- هر تم نسخه‌ی تاریک هم دارد (`theme.dark`) — اگر خالی باشد، به‌صورت خودکار با تنظیم روشنایی در فضای OKLCH ساخته می‌شود.
- `lib/theme.ts` کنتراست WCAG AA را محاسبه می‌کند؛ Color picker ادمین هشدار می‌دهد و Seed هم در زمان اجرا بررسی می‌شود (تست Vitest برای همه‌ی ۲۶ پالت).

---

## ۶. کامپوننت‌های Design System

`Button`, `Card`, `Badge`, `SectionHeader`, `FeatureGrid`, `PainPointList`, `ModuleGrid`, `PlatformCards`, `PricingCard`, `PricingTable`, `ComparisonTable`, `PriceTag` (قیمت خط‌خورده + تخفیف), `StatCounter` (انیمیشن با IntersectionObserver), `Testimonial`/`TestimonialCarousel`, `FAQAccordion` (+ JSON-LD), `DeviceMockup` (لپ‌تاپ/موبایل با UI ساختگی رنگی صنف), `Gallery`+`Lightbox`, `CTASection`, `DemoRequestForm`, `Breadcrumb` (+ JSON-LD), `Timeline`, `IndustryCard`, `ProductCard`, `EmptyState`, `Skeleton`, `FloatingContact`, `StickyMobileCTA`, `JsonLd`.

---

## ۷. فازها و خروجی هر فاز

| فاز | خروجی |
|---|---|
| **۱** | راه‌اندازی Next.js/TS/Tailwind/shadcn/ESLint/Prettier، فونت self-host، RTL، تاریک/روشن، سیستم تم صنف، Design System پایه، اسکیمای Prisma + migration، Seed (پلن‌ها، ۲۶ محصول با پالت، دسته‌ها، نقش‌ها، ادمین، تنظیمات)، docker-compose برای Postgres توسعه |
| **۲** | Header + مگامنو + منوی موبایل + Footer (اینماد/ساماندهی)، صفحه‌ی اصلی، `/products`، قالب لندینگ پویا با همه‌ی انواع سکشن، دکمه‌های شناور |
| **۳** | **محتوای کامل ۲۶ لندینگ** (هرکدام ۱۲۰۰–۱۵۰۰ کلمه‌ی منحصربه‌فرد، ۱۲+ امکان صنفی، ۸–۱۰ FAQ، نظرات نمونه)، `/pricing`، `/custom-software` + Wizard، `/website-design`، صفحات ثابت، ۴۰۴/۵۰۰ |
| **۴** | ورود OTP (کاوه‌نگار)، سبد خرید، کوپن، زرین‌پال، تولید خودکار لایسنس، API لایسنس، پنل کاربری کامل، تیکت، ارتقا با مابه‌التفاوت |
| **۵** | پنل مدیریت (۲۳ ماژول)، RBAC، Ctrl+K، DataTable + Excel، Section builder با dnd-kit، Kanban، کتابخانه‌ی رسانه، Audit log، بکاپ |
| **۶** | وبلاگ + Tiptap + امتیاز سئو، ۱۰ مقاله‌ی ۱۵۰۰+ کلمه‌ای، همه‌ی JSON-LDها، sitemap/robots، OG image پویا، ریدایرکت‌ها، لینک‌سازی داخلی خودکار |
| **۷** | بهینه‌سازی bundle و تصاویر، CSP/HSTS، rate limit، تست‌های Vitest و Playwright، Dockerfile نهایی + nginx + راهنمای استقرار، اجرای Lighthouse و گزارش |

بعد از هر فاز: کامیت + push روی شاخه‌ی `claude/trusting-babbage-ophqut` + خلاصه‌ی فاز.

---

## ۸. نکات و محدودیت‌هایی که باید بدانید

1. **حجم محتوا:** ۲۶ لندینگ × ~۱۴۰۰ کلمه + ۱۰ مقاله × ~۱۷۰۰ کلمه ≈ **۵۳٬۰۰۰ کلمه متن فارسی**. فاز ۳ و ۶ طولانی‌ترین فازها هستند. پیشنهاد: در فاز ۳ ابتدا ۶ صنف اصلی (طلا، دارو، سوپرمارکت، رستوران، کلینیک، پوشاک) را کامل می‌نویسم، بعد بقیه.
2. **اطلاعات واقعی موردنیاز از شما** (فعلاً با placeholder پر می‌شوند و از پنل قابل‌تغییرند): شماره‌ی تماس، آدرس، شماره‌ی واتس‌اپ/تلگرام، کد اینماد، Merchant ID زرین‌پال، API Key و قالب‌های Verify کاوه‌نگار، آمار واقعی (تعداد مشتری، سال تجربه).
3. **تصاویر:** موکاپ‌ها با کد (SVG/HTML) ساخته می‌شوند؛ اسکرین‌شات واقعی نرم‌افزارها را بعداً از کتابخانه‌ی رسانه جایگزین کنید.
4. **Lighthouse:** در محیط فعلی (کانتینر ابری با Chromium) قابل اجراست؛ عدد نهایی روی سرور واقعی با nginx و gzip/brotli ممکن است کمی متفاوت باشد.
5. نام مخزن `avinpart` است ولی سایت با برند AvinApps ساخته می‌شود — اگر منظور دیگری دارید بگویید.

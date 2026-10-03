/** تنظیمات پیش‌فرض سایت — همه از پنل مدیریت قابل تغییرند */
export const settings: Record<string, unknown> = {
  "site.name": "AvinApps",
  "site.nameFa": "آوین اپس",
  "site.tagline": "نرم‌افزار حسابداری تخصصی برای هر صنف",
  "site.logo": null,
  "site.favicon": null,
  "site.maintenance": false,
  "contact.phone": "۰۲۱-۰۰۰۰۰۰۰۰",
  "contact.mobile": "۰۹۱۲۰۰۰۰۰۰۰",
  "contact.email": "info@avinapps.ir",
  "contact.address": "تهران — نشانی دقیق از پنل مدیریت تکمیل شود",
  "contact.workingHours": "شنبه تا چهارشنبه ۹ تا ۱۸، پنجشنبه ۹ تا ۱۳",
  "contact.map": { lat: 35.6997, lng: 51.338 },
  "social.whatsapp": "",
  "social.telegram": "",
  "social.instagram": "",
  "social.linkedin": "",
  "social.aparat": "",
  "trust.enamadHtml": "",
  "trust.samandehiHtml": "",
  "stats.customers": 3200,
  "stats.years": 12,
  "stats.satisfaction": 98,
  "stats.industries": 26,
  "billing.taxPercent": 10,
  "billing.currency": "تومان",
  "seo.defaultTitle": "AvinApps | نرم‌افزار حسابداری و مدیریت کسب‌وکار برای همه‌ی صنف‌ها",
  "seo.defaultDescription":
    "نرم‌افزار حسابداری فروشگاهی تخصصی برای هر صنف؛ نسخه‌ی ویندوز، اندروید و تحت وب، اتصال به سامانه‌ی مودیان و طراحی نرم‌افزار و سایت اختصاصی.",
  "seo.googleSiteVerification": "",
  "seo.googleAnalyticsId": "",
  "seo.robotsExtra": "",
};

export const departments = ["پشتیبانی فنی", "فروش و مالی", "نصب و راه‌اندازی", "سفارش‌های اختصاصی"];

export const notificationTemplates = [
  {
    key: "otp",
    channel: "sms",
    body: "کد ورود شما به AvinApps: {{code}}\nاین کد تا ۲ دقیقه معتبر است.",
    kavenegarTemplate: "avinapps-otp",
  },
  {
    key: "order_paid",
    channel: "sms",
    body: "{{name}} عزیز، پرداخت سفارش {{number}} با موفقیت انجام شد. کلید لایسنس در پنل کاربری شما فعال است.\navinapps.ir/dashboard",
  },
  {
    key: "ticket_answered",
    channel: "sms",
    body: "به تیکت شماره {{number}} شما پاسخ داده شد.\navinapps.ir/dashboard/tickets",
  },
  {
    key: "custom_order_created",
    channel: "sms",
    body: "درخواست شما ثبت شد. کد پیگیری: {{trackingCode}}\nکارشناسان ما به‌زودی با شما تماس می‌گیرند.",
  },
  {
    key: "custom_order_status",
    channel: "sms",
    body: "وضعیت سفارش {{trackingCode}}: {{status}}\navinapps.ir/dashboard/projects",
  },
  {
    key: "license_expiring",
    channel: "sms",
    body: "{{name}} عزیز، سرویس ابری {{product}} شما {{days}} روز دیگر به پایان می‌رسد. برای تمدید: avinapps.ir/dashboard",
  },
  {
    key: "demo_request_admin",
    channel: "sms",
    body: "درخواست دموی جدید: {{name}} — {{mobile}} — {{product}}",
  },
];

export const cannedReplies = [
  {
    title: "دریافت تیکت",
    body: "سلام، وقت بخیر. درخواست شما دریافت شد و در حال بررسی است. نتیجه را در همین تیکت اطلاع می‌دهیم.",
  },
  {
    title: "راهنمای انتقال لایسنس",
    body: "برای انتقال لایسنس به سیستم جدید، ابتدا از پنل کاربری بخش «لایسنس‌ها» دستگاه قبلی را غیرفعال کنید و سپس نرم‌افزار را روی سیستم جدید فعال نمایید.",
  },
  {
    title: "درخواست اتصال از راه دور",
    body: "برای بررسی دقیق‌تر، لطفاً نرم‌افزار AnyDesk را نصب و شناسه‌ی آن را در همین تیکت ارسال کنید تا کارشناس ما متصل شود.",
  },
];

export const generalFaqs: Array<{ group: string; question: string; answer: string }> = [
  {
    group: "payment",
    question: "پرداخت به چه صورت انجام می‌شود؟",
    answer:
      "پرداخت به‌صورت آنلاین و از طریق درگاه امن زرین‌پال با همه‌ی کارت‌های عضو شتاب انجام می‌شود. بلافاصله پس از پرداخت، فاکتور رسمی و کلید لایسنس در پنل کاربری شما قرار می‌گیرد.",
  },
  {
    group: "payment",
    question: "آیا امکان پرداخت اقساطی یا چکی وجود دارد؟",
    answer:
      "برای پلن‌های آنلاین و آنلاین + سایت، امکان پرداخت در دو یا سه مرحله با هماهنگی واحد فروش وجود دارد. کافی است درخواست مشاوره ثبت کنید تا کارشناس فروش با شما تماس بگیرد.",
  },
  {
    group: "payment",
    question: "فاکتور رسمی صادر می‌شود؟",
    answer:
      "بله. برای همه‌ی خریدها فاکتور رسمی با اطلاعات کسب‌وکار شما (نام، شناسه‌ی ملی و کد اقتصادی) صادر می‌شود و در پنل کاربری قابل چاپ و دریافت است.",
  },
  {
    group: "payment",
    question: "اگر از نرم‌افزار راضی نباشم چه می‌شود؟",
    answer:
      "پیش از خرید می‌توانید نسخه‌ی دموی رایگان را نصب کنید یا دموی آنلاین با کارشناس داشته باشید. شرایط بازگشت وجه در صفحه‌ی «سیاست بازگشت وجه» به‌طور کامل توضیح داده شده است.",
  },
  {
    group: "license",
    question: "لایسنس آفلاین روی چند سیستم نصب می‌شود؟",
    answer:
      "لایسنس پلن آفلاین با قفل سخت‌افزاری روی یک سیستم فعال می‌شود. در صورت تعویض سیستم، می‌توانید از پنل کاربری دستگاه قبلی را غیرفعال کرده و لایسنس را منتقل کنید.",
  },
  {
    group: "license",
    question: "بعد از یک سال در پلن آنلاین چه اتفاقی می‌افتد؟",
    answer:
      "پلن آنلاین شامل یک سال سرویس ابری، همگام‌سازی و پشتیبانی است. پس از آن با پرداخت هزینه‌ی تمدید سالانه (بسیار کمتر از قیمت خرید) سرویس ادامه پیدا می‌کند. اطلاعات شما همیشه متعلق به خودتان است و قابل دریافت است.",
  },
  {
    group: "license",
    question: "آیا می‌توانم از پلن آفلاین به آنلاین ارتقا دهم؟",
    answer:
      "بله. از پنل کاربری بخش «ارتقای پلن» را انتخاب کنید؛ مبلغ پرداختی قبلی شما کسر می‌شود و فقط مابه‌التفاوت را پرداخت می‌کنید. اطلاعات قبلی هم به نسخه‌ی آنلاین منتقل می‌شود.",
  },
  {
    group: "general",
    question: "آیا نرم‌افزارها به سامانه‌ی مودیان مالیاتی متصل هستند؟",
    answer:
      "بله. همه‌ی محصولات Avin امکان ارسال صورتحساب الکترونیکی به سامانه‌ی مودیان را دارند و با تغییرات قوانین سازمان امور مالیاتی به‌روز می‌شوند.",
  },
];

export const menus = {
  header: [
    { label: "محصولات", href: "/products" },
    { label: "قیمت‌ها", href: "/pricing" },
    { label: "نرم‌افزار اختصاصی", href: "/custom-software" },
    { label: "طراحی سایت", href: "/website-design" },
    { label: "وبلاگ", href: "/blog" },
    { label: "تماس با ما", href: "/contact" },
  ],
  "footer-company": [
    { label: "درباره‌ی ما", href: "/about" },
    { label: "تماس با ما", href: "/contact" },
    { label: "وبلاگ", href: "/blog" },
    { label: "نمونه‌کارها", href: "/custom-software#portfolio" },
  ],
  "footer-services": [
    { label: "قیمت‌ها و پلن‌ها", href: "/pricing" },
    { label: "طراحی نرم‌افزار اختصاصی", href: "/custom-software" },
    { label: "طراحی سایت اختصاصی", href: "/website-design" },
    { label: "دانلود نسخه‌ی دمو", href: "/download" },
  ],
  "footer-support": [
    { label: "پشتیبانی", href: "/support" },
    { label: "سؤالات متداول", href: "/faq" },
    { label: "قوانین و مقررات", href: "/terms" },
    { label: "حریم خصوصی", href: "/privacy" },
    { label: "سیاست بازگشت وجه", href: "/refund-policy" },
  ],
};

export const pages = [
  { slug: "home", title: "صفحه‌ی اصلی" },
  { slug: "about", title: "درباره‌ی AvinApps" },
  { slug: "terms", title: "قوانین و مقررات" },
  { slug: "privacy", title: "حریم خصوصی" },
  { slug: "refund-policy", title: "سیاست بازگشت وجه" },
  { slug: "custom-software", title: "طراحی نرم‌افزار اختصاصی" },
  { slug: "website-design", title: "طراحی سایت اختصاصی" },
];

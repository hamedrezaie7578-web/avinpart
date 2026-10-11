/** ساختار منوی پنل مدیریت؛ هر آیتم فقط برای دارندگان مجوز read آن ماژول نمایش داده می‌شود */
export type AdminNavItem = { href: string; label: string; icon: string; perm: string };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "کلی",
    items: [
      { href: "/admin", label: "داشبورد", icon: "LayoutDashboard", perm: "dashboard.read" },
      { href: "/admin/reports", label: "گزارش‌ها", icon: "BarChart3", perm: "reports.read" },
    ],
  },
  {
    title: "فروش",
    items: [
      { href: "/admin/orders", label: "سفارش‌ها و پرداخت‌ها", icon: "Receipt", perm: "orders.read" },
      { href: "/admin/licenses", label: "لایسنس‌ها", icon: "Lock", perm: "licenses.read" },
      { href: "/admin/coupons", label: "کدهای تخفیف", icon: "Percent", perm: "coupons.read" },
      { href: "/admin/customers", label: "مشتریان", icon: "Users", perm: "customers.read" },
      { href: "/admin/custom-orders", label: "سفارش‌های اختصاصی", icon: "Code2", perm: "customOrders.read" },
      { href: "/admin/forms", label: "فرم‌ها و درخواست‌ها", icon: "FileText", perm: "forms.read" },
    ],
  },
  {
    title: "محصولات",
    items: [
      { href: "/admin/products", label: "محصولات", icon: "Package", perm: "products.read" },
      { href: "/admin/industries", label: "صنف‌ها و دسته‌ها", icon: "Layers", perm: "industries.read" },
      { href: "/admin/plans", label: "پلن‌ها و قیمت‌ها", icon: "Tags", perm: "plans.read" },
      { href: "/admin/releases", label: "نسخه‌ها و دانلودها", icon: "Rocket", perm: "releases.read" },
    ],
  },
  {
    title: "محتوا",
    items: [
      { href: "/admin/blog", label: "وبلاگ", icon: "BookOpen", perm: "blog.read" },
      { href: "/admin/pages", label: "صفحات و صفحه‌ی اصلی", icon: "FileText", perm: "pages.read" },
      { href: "/admin/menus", label: "منوها", icon: "Grid3x3", perm: "menus.read" },
      { href: "/admin/content", label: "نمونه‌کار، نظرات، FAQ", icon: "Sparkles", perm: "content.read" },
      { href: "/admin/media", label: "کتابخانه‌ی رسانه", icon: "Database", perm: "media.read" },
    ],
  },
  {
    title: "پشتیبانی",
    items: [
      { href: "/admin/tickets", label: "تیکت‌ها", icon: "Headphones", perm: "tickets.read" },
      { href: "/admin/notifications", label: "اعلان‌ها و پیامک", icon: "BellRing", perm: "notifications.read" },
    ],
  },
  {
    title: "سیستم",
    items: [
      { href: "/admin/admins", label: "مدیران و نقش‌ها", icon: "UserCog", perm: "admins.read" },
      { href: "/admin/seo", label: "سئو و ریدایرکت‌ها", icon: "Search", perm: "seo.read" },
      { href: "/admin/settings", label: "تنظیمات عمومی", icon: "Settings", perm: "settings.read" },
      { href: "/admin/audit", label: "لاگ و پشتیبان‌گیری", icon: "ShieldCheck", perm: "audit.read" },
    ],
  },
];

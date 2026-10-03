/**
 * مجوزهای پنل مدیریت (RBAC).
 * هر ماژول مجوز «read» و در صورت نیاز «write» و مجوزهای خاص دارد.
 * نقش «مدیر کل» مجوز ویژه‌ی "*" دارد.
 */
export const PERMISSION_GROUPS = {
  dashboard: { label: "داشبورد", actions: ["read"] },
  products: { label: "محصولات", actions: ["read", "write", "delete"] },
  industries: { label: "صنف‌ها و دسته‌بندی‌ها", actions: ["read", "write"] },
  plans: { label: "پلن‌ها و قیمت‌گذاری", actions: ["read", "write"] },
  orders: { label: "سفارش‌ها و پرداخت‌ها", actions: ["read", "write", "refund"] },
  licenses: { label: "لایسنس‌ها", actions: ["read", "write", "revoke"] },
  releases: { label: "نسخه‌ها و دانلودها", actions: ["read", "write"] },
  customOrders: { label: "سفارش‌های اختصاصی", actions: ["read", "write"] },
  customers: { label: "مشتریان", actions: ["read", "write", "block"] },
  admins: { label: "مدیران و نقش‌ها", actions: ["read", "write"] },
  tickets: { label: "تیکت‌ها", actions: ["read", "write"] },
  blog: { label: "وبلاگ", actions: ["read", "write", "publish"] },
  pages: { label: "صفحات و صفحه‌ی اصلی", actions: ["read", "write"] },
  menus: { label: "منوها", actions: ["read", "write"] },
  content: { label: "نمونه‌کار، نظرات و FAQ", actions: ["read", "write"] },
  media: { label: "کتابخانه‌ی رسانه", actions: ["read", "write", "delete"] },
  coupons: { label: "کدهای تخفیف", actions: ["read", "write"] },
  forms: { label: "فرم‌ها و درخواست‌ها", actions: ["read", "write"] },
  notifications: { label: "اعلان‌ها و پیامک", actions: ["read", "write", "send"] },
  seo: { label: "تنظیمات سئو", actions: ["read", "write"] },
  settings: { label: "تنظیمات عمومی", actions: ["read", "write"] },
  reports: { label: "گزارش‌ها", actions: ["read", "export"] },
  audit: { label: "لاگ فعالیت‌ها و پشتیبان‌گیری", actions: ["read", "backup"] },
} as const;

export type PermissionModule = keyof typeof PERMISSION_GROUPS;
export type Permission = "*" | `${PermissionModule}.${string}`;

export const ALL_PERMISSIONS: string[] = Object.entries(PERMISSION_GROUPS).flatMap(([m, g]) =>
  g.actions.map((a) => `${m}.${a}`),
);

export function hasPermission(
  userPermissions: readonly string[] | undefined,
  required: string,
): boolean {
  if (!userPermissions) return false;
  if (userPermissions.includes("*")) return true;
  if (userPermissions.includes(required)) return true;
  // مجوز write شامل read هم می‌شود
  const [mod, action] = required.split(".");
  if (action === "read") return userPermissions.some((p) => p.startsWith(`${mod}.`));
  return false;
}

export const SYSTEM_ROLES: Array<{
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}> = [
  {
    name: "مدیر کل",
    description: "دسترسی کامل به همه‌ی بخش‌ها",
    isSystem: true,
    permissions: ["*"],
  },
  {
    name: "فروش",
    description: "سفارش‌ها، مشتریان، کدهای تخفیف، لایسنس‌ها و سفارش‌های اختصاصی",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "orders.read",
      "orders.write",
      "customers.read",
      "customers.write",
      "licenses.read",
      "licenses.write",
      "coupons.read",
      "coupons.write",
      "customOrders.read",
      "customOrders.write",
      "forms.read",
      "forms.write",
      "reports.read",
      "reports.export",
      "plans.read",
      "products.read",
    ],
  },
  {
    name: "پشتیبانی",
    description: "تیکت‌ها، لایسنس‌ها، نسخه‌ها و مشتریان",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "tickets.read",
      "tickets.write",
      "customers.read",
      "licenses.read",
      "licenses.write",
      "releases.read",
      "releases.write",
      "orders.read",
      "forms.read",
      "forms.write",
    ],
  },
  {
    name: "محتوا",
    description: "وبلاگ، صفحات، محصولات، منوها، رسانه و سئو",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "blog.read",
      "blog.write",
      "blog.publish",
      "pages.read",
      "pages.write",
      "products.read",
      "products.write",
      "menus.read",
      "menus.write",
      "content.read",
      "content.write",
      "media.read",
      "media.write",
      "seo.read",
      "seo.write",
      "industries.read",
      "industries.write",
    ],
  },
];

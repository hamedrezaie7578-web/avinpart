/**
 * Seed دیتابیس: idempotent است (با upsert) و می‌توان چند بار اجرا کرد.
 * اجرا: npm run db:seed
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { categories, products } from "./data/products";
import { comparison, plans } from "./data/plans";
import {
  cannedReplies,
  departments,
  generalFaqs,
  menus,
  notificationTemplates,
  pages,
  settings,
} from "./data/settings";
import { generalTestimonials } from "./data/testimonials";
import { seedLandings } from "./landings";
import { portfolio, serviceFaqs } from "./data/services";
import { pageContents } from "./content/pages";
import { SYSTEM_ROLES } from "../../src/lib/permissions";
import { auditTheme } from "../../src/lib/theme";

const db = new PrismaClient();

async function seedRolesAndAdmin() {
  for (const r of SYSTEM_ROLES) {
    await db.role.upsert({
      where: { name: r.name },
      update: { description: r.description, permissions: r.permissions },
      create: r,
    });
  }
  const superRole = await db.role.findUniqueOrThrow({ where: { name: "مدیر کل" } });
  const mobile = process.env.SEED_ADMIN_MOBILE ?? "09120000000";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await db.user.upsert({
    where: { mobile },
    update: { type: "ADMIN", roleId: superRole.id },
    create: {
      mobile,
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@avinapps.ir",
      name: "مدیر سایت",
      type: "ADMIN",
      roleId: superRole.id,
      passwordHash,
    },
  });
  console.log(`✔ نقش‌ها و ادمین (${mobile})`);
}

async function seedCatalog() {
  const catIds = new Map<string, string>();
  for (const c of categories) {
    const row = await db.industryCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: c,
    });
    catIds.set(c.slug, row.id);
  }

  for (const [i, p] of products.entries()) {
    const issues = auditTheme(p.theme);
    if (issues.length) console.warn(`⚠ کنتراست ناکافی در ${p.slug}:`, issues);
    const data = {
      name: p.name,
      industryName: p.industryName,
      shortDesc: p.shortDesc,
      icon: p.icon,
      categoryId: catIds.get(p.category),
      theme: p.theme as unknown as Prisma.InputJsonValue,
      isFeatured: p.isFeatured ?? false,
      sortOrder: i,
      focusKeyword: p.focusKeyword,
      keywords: p.keywords,
      seoTitle: `${p.focusKeyword} | ${p.name}`,
      seoDescription: `${p.name}؛ ${p.shortDesc} نسخه‌ی ویندوز، اندروید و تحت وب با اتصال به سامانه‌ی مودیان.`,
    };
    // محتوای ویرایش‌شده در پنل (مثل تم یا متن) در اجرای مجدد Seed بازنویسی نمی‌شود
    await db.product.upsert({
      where: { slug: p.slug },
      update: { categoryId: data.categoryId },
      create: { slug: p.slug, status: "PUBLISHED", ...data },
    });
  }
  console.log(`✔ ${categories.length} دسته و ${products.length} محصول`);
}

async function seedPlans() {
  for (const { highlights: _highlights, ...p } of plans) {
    await db.plan.upsert({ where: { code: p.code }, update: {}, create: { ...p } });
  }
  const planRows = await db.plan.findMany({ orderBy: { sortOrder: "asc" } });

  if ((await db.comparisonFeature.count()) === 0) {
    for (const [i, [group, title, ...values]] of comparison.entries()) {
      await db.comparisonFeature.create({
        data: {
          group,
          title,
          sortOrder: i,
          values: {
            create: planRows.map((plan, idx) => {
              const v = values[idx]!;
              return {
                planId: plan.id,
                included: v !== false,
                note: typeof v === "string" ? v : null,
              };
            }),
          },
        },
      });
    }
  }
  // highlights هر پلن به‌عنوان تنظیمات قابل ویرایش ذخیره می‌شود
  for (const p of plans) {
    await db.setting.upsert({
      where: { key: `plan.${p.code}.highlights` },
      update: {},
      create: { key: `plan.${p.code}.highlights`, value: p.highlights },
    });
  }
  console.log(`✔ ${plans.length} پلن و ${comparison.length} ردیف جدول مقایسه`);
}

async function seedSettingsAndContent() {
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as Prisma.InputJsonValue },
    });
  }
  for (const name of departments) {
    if (!(await db.department.findFirst({ where: { name } })))
      await db.department.create({ data: { name } });
  }
  for (const t of notificationTemplates) {
    await db.notificationTemplate.upsert({ where: { key: t.key }, update: {}, create: t });
  }
  if ((await db.cannedReply.count()) === 0)
    await db.cannedReply.createMany({ data: cannedReplies });
  if ((await db.faq.count({ where: { productId: null } })) === 0) {
    await db.faq.createMany({ data: generalFaqs.map((f, i) => ({ ...f, sortOrder: i })) });
  }
  if ((await db.testimonial.count({ where: { productId: null } })) === 0) {
    await db.testimonial.createMany({
      data: generalTestimonials.map((t, i) => ({ ...t, isSample: true, sortOrder: i })),
    });
  }
  for (const [i, p] of portfolio.entries()) {
    await db.portfolioItem.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, sortOrder: i },
    });
  }
  if (
    (await db.faq.count({ where: { productId: null, group: { in: ["custom", "website"] } } })) === 0
  ) {
    await db.faq.createMany({ data: serviceFaqs.map((f, i) => ({ ...f, sortOrder: i })) });
  }
  for (const [key, items] of Object.entries(menus)) {
    const menu = await db.menu.upsert({ where: { key }, update: {}, create: { key } });
    if ((await db.menuItem.count({ where: { menuId: menu.id } })) === 0) {
      await db.menuItem.createMany({
        data: items.map((it, i) => ({ ...it, menuId: menu.id, sortOrder: i })),
      });
    }
  }
  for (const p of pages) {
    const c = pageContents[p.slug];
    const content = c ? { html: c.html } : undefined;
    const data = {
      title: c?.title ?? p.title,
      seoTitle: c?.seoTitle,
      seoDescription: c?.seoDescription,
      content,
    };
    const existing = await db.page.findUnique({ where: { slug: p.slug } });
    if (!existing) await db.page.create({ data: { slug: p.slug, ...data } });
    // صفحه‌ای که هنوز محتوایی ندارد (Seed قبلی) پر می‌شود؛ محتوای ویرایش‌شده دست‌نخورده می‌ماند
    else if (!existing.content && content) await db.page.update({ where: { slug: p.slug }, data });
  }
  console.log("✔ تنظیمات، منوها، دپارتمان‌ها، قالب‌های پیامک و FAQ عمومی");
}

async function main() {
  await seedRolesAndAdmin();
  await seedCatalog();
  await seedPlans();
  await seedSettingsAndContent();
  await seedLandings(db);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

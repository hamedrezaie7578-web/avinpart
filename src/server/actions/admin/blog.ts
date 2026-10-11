"use server";

import { db } from "@/lib/db";
import { cleanHtml } from "@/lib/sanitize";
import { addHeadingIds, countWords, readingMinutes, seoAnalysis, stripTags } from "@/lib/blog";
import { hasPermission } from "@/lib/permissions";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";
import { invalidate } from "@/server/admin/revalidate";

function slugOrThrow(v: string) {
  const s = v.trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) throw new ActionError("نامک فقط حروف کوچک انگلیسی، عدد و خط تیره.");
  return s;
}

/** برچسب‌ها با نام وارد می‌شوند؛ برچسب جدید خودکار ساخته می‌شود */
async function resolveTags(names: string[]) {
  const ids: string[] = [];
  for (const raw of names.slice(0, 15)) {
    const name = raw.trim();
    if (!name) continue;
    const existing = await db.tag.findFirst({ where: { name } });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    let slug = `tag-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const latin = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (latin && !(await db.tag.findUnique({ where: { slug: latin } }))) slug = latin;
    ids.push((await db.tag.create({ data: { name, slug } })).id);
  }
  return ids;
}

export async function savePost(id: string | null, f: FormData) {
  return adminAction<{ id: string }>("blog.write", async (admin) => {
    const html = addHeadingIds(cleanHtml(String(f.get("html") ?? "")));
    const words = countWords(stripTags(html));
    let status = fd.str(f, "status") as "DRAFT" | "PUBLISHED" | "ARCHIVED";
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) status = "DRAFT";
    const existing = id ? await db.post.findUnique({ where: { id } }) : null;
    // انتشار نیازمند مجوز blog.publish است
    if (status === "PUBLISHED" && existing?.status !== "PUBLISHED" && !hasPermission(admin.permissions, "blog.publish")) throw new ActionError("شما مجوز انتشار مقاله را ندارید؛ به‌صورت پیش‌نویس ذخیره کنید.");
    let publishAt = fd.date(f, "publishAt");
    if (status === "PUBLISHED" && !publishAt) publishAt = existing?.publishAt ?? new Date();
    const data = {
      slug: slugOrThrow(fd.str(f, "slug")),
      title: fd.str(f, "title", { required: "عنوان مقاله را وارد کنید.", max: 160 }),
      excerpt: fd.str(f, "excerpt", { required: "خلاصه‌ی مقاله را وارد کنید.", max: 400 }),
      content: { html },
      contentHtml: html,
      readingMinutes: readingMinutes(words),
      coverId: fd.opt(f, "coverId"),
      categoryId: fd.opt(f, "categoryId"),
      status,
      publishAt,
      seoTitle: fd.opt(f, "seoTitle"),
      seoDescription: fd.opt(f, "seoDescription"),
      focusKeyword: fd.opt(f, "focusKeyword"),
    };
    const seo = seoAnalysis({ ...data, html, hasCover: !!data.coverId });
    const tagIds = await resolveTags(fd.str(f, "tags").split(/[,،]/));
    const productIds = fd.arr(f, "productIds");
    const rel = { tags: { set: tagIds.map((t) => ({ id: t })) }, products: { set: productIds.map((p) => ({ id: p })) } };
    const post = id
      ? await db.post.update({ where: { id }, data: { ...data, seoScore: seo.score, ...rel } })
      : await db.post.create({ data: { ...data, seoScore: seo.score, authorId: admin.id, tags: { connect: tagIds.map((t) => ({ id: t })) }, products: { connect: productIds.map((p) => ({ id: p })) } } });
    await audit(admin.id, id ? "post.update" : "post.create", "Post", post.id, { title: data.title, status, words, seoScore: seo.score });
    invalidate.posts();
    invalidate.products(); // مقالات مرتبط در لندینگ محصولات
    return { ok: true, message: `ذخیره شد — ${words.toLocaleString("fa-IR")} کلمه، امتیاز سئو ${seo.score.toLocaleString("fa-IR")}.`, data: { id: post.id } };
  });
}

export async function deletePost(id: string) {
  return adminAction("blog.write", async (admin) => {
    await db.post.delete({ where: { id } });
    await audit(admin.id, "post.delete", "Post", id);
    invalidate.posts();
    return { ok: true, message: "مقاله حذف شد." };
  });
}

export async function savePostCategory(id: string | null, f: FormData) {
  return adminAction("blog.write", async (admin) => {
    const data = { name: fd.str(f, "name", { required: "نام دسته را وارد کنید." }), slug: slugOrThrow(fd.str(f, "slug")), description: fd.opt(f, "description") };
    const c = id ? await db.postCategory.update({ where: { id }, data }) : await db.postCategory.create({ data });
    await audit(admin.id, "postCategory.save", "PostCategory", c.id, data);
    invalidate.posts();
    return { ok: true, message: "دسته ذخیره شد." };
  });
}

export async function deletePostCategory(id: string) {
  return adminAction("blog.write", async (admin) => {
    await db.post.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await db.postCategory.delete({ where: { id } });
    await audit(admin.id, "postCategory.delete", "PostCategory", id);
    invalidate.posts();
    return { ok: true, message: "حذف شد." };
  });
}

export async function saveTag(id: string, f: FormData) {
  return adminAction("blog.write", async (admin) => {
    const data = { name: fd.str(f, "name", { required: "نام برچسب را وارد کنید." }), slug: slugOrThrow(fd.str(f, "slug")) };
    await db.tag.update({ where: { id }, data });
    await audit(admin.id, "tag.save", "Tag", id, data);
    invalidate.posts();
    return { ok: true, message: "برچسب ذخیره شد." };
  });
}

export async function deleteTag(id: string) {
  return adminAction("blog.write", async (admin) => {
    await db.tag.delete({ where: { id } });
    await audit(admin.id, "tag.delete", "Tag", id);
    invalidate.posts();
    return { ok: true, message: "حذف شد." };
  });
}

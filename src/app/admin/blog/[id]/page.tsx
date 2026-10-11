import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminPage, LinkButton } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/form";
import { PostEditor } from "@/components/admin/post-editor";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { requireAdmin } from "@/server/admin/guard";
import { toLocalInput } from "@/server/admin/fd";
import { deletePost, savePost } from "@/server/actions/admin/blog";

export const metadata = { title: "ویرایش مقاله" };

export default async function PostEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin("blog.write");
  const { id } = await params;
  const isNew = id === "new";
  const [post, categories, products] = await Promise.all([
    isNew ? null : db.post.findUnique({ where: { id }, include: { tags: true, products: { select: { id: true } }, cover: true } }),
    db.postCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!isNew && !post) notFound();
  return (
    <AdminPage
      title={isNew ? "مقاله‌ی جدید" : post!.title}
      back={{ href: "/admin/blog", label: "وبلاگ" }}
      actions={
        post && (
          <>
            {post.status === "PUBLISHED" && <LinkButton href={`/blog/${post.slug}`} variant="outline"><ExternalLink className="size-4" aria-hidden />مشاهده</LinkButton>}
            <DeleteButton action={deletePost.bind(null, id)} redirectTo="/admin/blog" />
          </>
        )
      }
    >
      <PostEditor
        id={isNew ? null : id}
        action={savePost.bind(null, isNew ? null : id)}
        canPublish={hasPermission(admin.permissions, "blog.publish")}
        categories={categories}
        products={products}
        initial={{
          title: post?.title ?? "",
          slug: post?.slug ?? "",
          excerpt: post?.excerpt ?? "",
          html: post?.contentHtml ?? "",
          status: post?.status ?? "DRAFT",
          publishAt: toLocalInput(post?.publishAt),
          categoryId: post?.categoryId ?? "",
          tags: post?.tags.map((t) => t.name).join("، ") ?? "",
          productIds: post?.products.map((p) => p.id) ?? [],
          seoTitle: post?.seoTitle ?? "",
          seoDescription: post?.seoDescription ?? "",
          focusKeyword: post?.focusKeyword ?? "",
          cover: post?.cover ? { id: post.cover.id, url: post.cover.url } : null,
        }}
      />
    </AdminPage>
  );
}

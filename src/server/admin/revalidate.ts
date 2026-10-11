import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/server/queries/catalog";

/** باطل کردن کش صفحات عمومی پس از تغییر از پنل مدیریت */
export const invalidate = {
  products() {
    revalidateTag(CACHE_TAGS.products);
    revalidatePath("/", "layout");
  },
  plans() {
    revalidateTag(CACHE_TAGS.plans);
    revalidatePath("/", "layout");
  },
  settings() {
    revalidateTag(CACHE_TAGS.settings);
    revalidatePath("/", "layout");
  },
  menus() {
    revalidateTag("menus");
    revalidatePath("/", "layout");
  },
  pages() {
    revalidateTag("pages");
    revalidatePath("/", "layout");
  },
  content() {
    revalidateTag("content");
    revalidateTag(CACHE_TAGS.products);
    revalidatePath("/", "layout");
  },
  posts() {
    revalidateTag("posts");
    revalidatePath("/blog", "layout");
    revalidatePath("/");
  },
};

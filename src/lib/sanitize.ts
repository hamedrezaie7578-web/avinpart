import "server-only";
import sanitize from "sanitize-html";

/**
 * پاک‌سازی HTML تولیدشده در ویرایشگر پنل پیش از ذخیره (جلوگیری از XSS ذخیره‌شده؛
 * نقش «محتوا» نباید بتواند اسکریپت در صفحات یا پنل سایر مدیران تزریق کند).
 */
export function cleanHtml(html: string): string {
  return sanitize(html, {
    allowedTags: ["h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "code", "pre", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "span", "mark"],
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height", "loading"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"], span: ["dir"], p: ["dir"] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs) => {
        const external = /^https?:\/\//.test(attribs.href ?? "") && !(attribs.href ?? "").includes("avinapps.ir");
        return { tagName: "a", attribs: { ...attribs, ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}) } };
      },
      img: (tag, attribs) => ({ tagName: "img", attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

/** متن ساده از HTML (برای شمارش کلمات و تحلیل سئو) */
export function htmlToText(html: string): string {
  return sanitize(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

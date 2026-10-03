export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://avinapps.ir").replace(
  /\/$/,
  "",
);
export const SITE_NAME = "AvinApps";
export const SITE_NAME_FA = "آوین اپس";

export function absoluteUrl(path = "/"): string {
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`);
}

import localFont from "next/font/local";

/** وزیرمتن — به‌صورت self-host از src/fonts (بدون وابستگی به CDN خارجی) */
export const vazirmatn = localFont({
  src: "../fonts/Vazirmatn-Variable.woff2",
  variable: "--font-vazirmatn",
  weight: "100 900",
  display: "swap",
  preload: true,
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});

import { OG_SIZE, renderOg } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "AvinApps — نرم‌افزار حسابداری تخصصی هر صنف";

export default function Image() {
  return renderOg({ eyebrow: "۲۶ نرم‌افزار تخصصی", title: "نرم‌افزار حسابداری تخصصی برای هر صنف", subtitle: "ویندوز، اندروید و وب — متصل به سامانه‌ی مودیان، با نصب و آموزش رایگان" });
}

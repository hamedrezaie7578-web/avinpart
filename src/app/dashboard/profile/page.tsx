import { ProfileForm } from "@/components/dashboard/profile-form";
import { PageTitle, Panel } from "@/components/dashboard/ui";
import { toFaDigits } from "@/lib/format";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "پروفایل" };

export default async function ProfilePage() {
  const user = await requireCustomer("/dashboard/profile");
  return (
    <>
      <PageTitle
        title="پروفایل و اطلاعات کسب‌وکار"
        description={`شماره موبایل حساب: ${toFaDigits(user.mobile)} (برای تغییر شماره با پشتیبانی تماس بگیرید)`}
      />
      <Panel>
        <ProfileForm user={user} />
      </Panel>
    </>
  );
}

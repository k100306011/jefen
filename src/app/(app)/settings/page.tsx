import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import { SettingsForm, DangerZone } from "@/components/app/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#2C2926" }}>
          設定
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#7C7064" }}>
          管理你的分眾屬性與帳號。
        </p>
      </div>

      <SettingsForm
        initial={{
          name: user.name ?? "",
          email: user.email ?? "",
          gender: user.gender ?? "",
          ageRange: user.ageRange ?? "",
          region: user.region ?? "",
        }}
      />

      <DangerZone />
    </div>
  );
}

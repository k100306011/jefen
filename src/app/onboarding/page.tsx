import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import { OnboardingForm } from "@/components/app/OnboardingForm";
import { WarmGlow } from "@/components/decorative/WarmGlow";
import { OrganicBlob } from "@/components/decorative/OrganicBlob";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  if (user.onboardedAt) redirect("/dashboard");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ background: "linear-gradient(160deg, #FBF8F3 0%, #F4EFE7 100%)" }}
    >
      <div className="relative w-full max-w-md">
        <WarmGlow
          color="rose"
          size={320}
          opacity={0.1}
          className="absolute -top-20 -right-20 pointer-events-none"
        />
        <OrganicBlob
          color="teal"
          opacity={0.06}
          size={220}
          className="absolute -bottom-12 -left-12 pointer-events-none"
        />
        <OnboardingForm />
      </div>
    </div>
  );
}

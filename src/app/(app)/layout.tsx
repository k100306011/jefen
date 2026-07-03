import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import { AppNav } from "@/components/app/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  if (!user.onboardedAt) redirect("/onboarding");

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #FBF8F3 0%, #F4EFE7 100%)",
      }}
    >
      <AppNav name={user.name} />
      <main className="mx-auto w-full max-w-2xl px-5 py-6">{children}</main>
    </div>
  );
}

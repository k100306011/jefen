import Link from "next/link";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { LogoMark } from "@/components/ui/Logo";
import { DevLogin } from "@/components/app/DevLogin";
import { WarmGlow } from "@/components/decorative/WarmGlow";
import { OrganicBlob } from "@/components/decorative/OrganicBlob";
import { SquiggleUnderline } from "@/components/decorative/SquiggleUnderline";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg, #FBF8F3 0%, #F4EFE7 100%)" }}
    >
      <div className="relative w-full max-w-sm">
        {/* Decorative */}
        <WarmGlow
          color="rose"
          size={320}
          opacity={0.1}
          className="absolute -top-20 -right-20 pointer-events-none"
        />
        <OrganicBlob
          color="gold"
          opacity={0.07}
          size={200}
          className="absolute -bottom-10 -left-10 pointer-events-none"
        />

        <div
          className="relative card-surface p-8 flex flex-col items-center gap-6 text-center"
        >
          <div>
            <LogoMark size={48} className="mx-auto mb-3" />
            <h1
              className="text-2xl font-bold"
              style={{ color: "#2C2926", letterSpacing: "-0.02em" }}
            >
              登入幾分
            </h1>
            <SquiggleUnderline width={60} color="#E8628A" className="mt-2 mx-auto" />
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "#7C7064" }}>
            用 Google 帳號快速開始，
            <br />
            無需另外設定密碼
          </p>

          <GoogleSignInButton callbackUrl="/dashboard" />

          {process.env.NODE_ENV !== "production" && <DevLogin />}

          <p className="text-xs leading-relaxed" style={{ color: "#B0A496" }}>
            登入即表示你已閱讀並同意我們的
            <Link
              href="/terms"
              className="underline underline-offset-2"
              style={{ color: "#7C7064" }}
            >
              服務條款
            </Link>
            與
            <Link
              href="/privacy"
              className="underline underline-offset-2"
              style={{ color: "#7C7064" }}
            >
              隱私權政策
            </Link>
            。
            <br />
            僅限 18 歲以上使用。
          </p>
        </div>
      </div>
    </div>
  );
}

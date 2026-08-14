import { SocialProofEyebrow } from "@/components/ui/SocialProofEyebrow";
import { InsightCard } from "@/components/ui/InsightCard";
import { HeroDashboard } from "@/components/ui/HeroDashboard";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { Logo } from "@/components/ui/Logo";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { StructuredData } from "@/components/ui/StructuredData";
import { SquiggleUnderline } from "@/components/decorative/SquiggleUnderline";
import { WarmGlow } from "@/components/decorative/WarmGlow";
import { OrganicBlob } from "@/components/decorative/OrganicBlob";
import { getSiteStats } from "@/lib/queries";

// ISR：每 5 分鐘再生，統計數字保持新鮮又不犧牲靜態速度
export const revalidate = 300;

const insightCards = [
  {
    tagLabel: "性別分眾",
    tagColor: "#E8628A",
    metricValue: "+0.9",
    metricUnit: "女生眼中",
    description: "在 18–24 歲女生眼中比同齡高出 0.9 分，找到最買單你的族群",
  },
  {
    tagLabel: "前後對比",
    tagColor: "#46C2A6",
    metricValue: "+0.6",
    metricUnit: "剪髮後",
    description: "換了髮型，分數一週內提升 0.6，看得到的成長",
  },
  {
    tagLabel: "地區",
    tagColor: "#EBA63E",
    metricValue: "8.1",
    metricUnit: "中南部",
    description: "中南部 18–24 歲打出你最高分，你的臉有地域吸引力",
  },
];

export default async function LandingPage() {
  const stats = await getSiteStats();
  // 只呈現真實數字；沒有照片時不顯示這個徽章（不捏造社會證明）。
  const photosInPool = stats.photosInPool;
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #FBF8F3 0%, #F4EFE7 100%)" }}
    >
      <StructuredData />
      {/* ── Nav ── */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: "#EBE3D7", color: "#9C8E7E" }}
          >
            beta
          </span>
        </div>
        {photosInPool > 0 && <SocialProofEyebrow count={photosInPool} />}
      </header>

      <main>
        {/* ── Mobile hero ── */}
        <section className="relative px-5 pt-8 pb-6 md:hidden">
          <WarmGlow
            color="rose"
            size={320}
            opacity={0.09}
            className="absolute -top-20 -right-20 pointer-events-none"
          />
          <OrganicBlob
            color="teal"
            opacity={0.06}
            size={220}
            className="absolute top-0 -left-16 pointer-events-none"
          />

          <div className="relative mb-6">
            <h1
              className="text-4xl font-bold leading-tight"
              style={{ color: "#2C2926", letterSpacing: "-0.02em" }}
            >
              真人眼中的你，
              <br />
              <span style={{ color: "#C0396B" }}>幾分？</span>
            </h1>
            <SquiggleUnderline width={80} color="#E8628A" className="mt-2" />
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "#5C5248" }}
            >
              不只一個數字——你會知道自己在不同性別、年齡、地區眼中各是幾分，
              還能看到自己一次比一次更好。
            </p>
          </div>

          <HeroDashboard />

          <div className="mt-8 flex flex-col items-center gap-3">
            <GoogleSignInButton callbackUrl="/dashboard" />
            <p className="text-xs text-center" style={{ color: "#B0A496" }}>
              免費 · 限 18 歲以上 · 每晚 21:00 揭曉
            </p>
          </div>
        </section>

        {/* ── Desktop two-column hero ── */}
        <section className="relative hidden md:grid md:grid-cols-2 md:gap-12 md:items-center md:min-h-[88vh] md:px-16 lg:px-24 xl:px-32 md:py-16">
          <WarmGlow
            color="rose"
            size={500}
            opacity={0.08}
            className="absolute -top-32 -right-20 pointer-events-none"
          />
          <OrganicBlob
            color="gold"
            opacity={0.05}
            size={300}
            className="absolute bottom-0 left-0 pointer-events-none"
          />

          {/* Left: copy */}
          <div className="relative">
            <h1
              className="font-bold leading-tight mb-4"
              style={{
                fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                color: "#2C2926",
                letterSpacing: "-0.02em",
              }}
            >
              真人眼中的你，
              <br />
              <span style={{ color: "#C0396B" }}>幾分？</span>
            </h1>
            <SquiggleUnderline width={110} color="#E8628A" className="mb-6" />
            <p
              className="text-lg leading-relaxed mb-8 max-w-sm"
              style={{ color: "#5C5248" }}
            >
              不只一個數字——你會知道自己在不同性別、年齡、地區眼中各是幾分，
              還能看到自己一次比一次更好。
            </p>
            <div className="flex flex-col items-start gap-3">
              <GoogleSignInButton callbackUrl="/dashboard" />
              <p className="text-sm" style={{ color: "#B0A496" }}>
                免費 · 限 18 歲以上 · 每晚 21:00 揭曉
              </p>
            </div>
          </div>

          {/* Right: dashboard preview */}
          <div className="relative">
            <HeroDashboard />
          </div>
        </section>

        {/* ── You'll discover ── */}
        <section className="px-5 py-8 md:px-16 lg:px-24 xl:px-32">
          <div className="mb-5">
            <p className="text-label-eyebrow mb-1">你會發現</p>
            <h2 className="text-xl font-bold" style={{ color: "#2C2926" }}>
              不只一個分數
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {insightCards.map((card, i) => (
              <div key={i} className="snap-start shrink-0 w-64 md:w-auto">
                <InsightCard
                  tagLabel={card.tagLabel}
                  tagColor={card.tagColor}
                  metricValue={card.metricValue}
                  metricUnit={card.metricUnit}
                  description={card.description}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="px-5 py-8 md:px-16 lg:px-24 xl:px-32">
          <p className="text-label-eyebrow mb-4">怎麼玩</p>
          <ol className="flex flex-col gap-5 md:grid md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "1",
                title: "上傳你的照片",
                desc: "最多 2 張，AI 守門員自動過濾不適當內容",
              },
              {
                n: "2",
                title: "幫別人評分",
                desc: "評滿 10 張照片解鎖你的結果——1:1 互惠，公平公正",
              },
              {
                n: "3",
                title: "解鎖你的定位",
                desc: "每晚 21:00 揭曉，看你在不同族群眼中的分數與百分位",
              },
              {
                n: "4",
                title: "追蹤你的成長",
                desc: "上傳第二張對比照，看分數的 delta——看得到的進步",
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-4 items-start">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: "#C0396B", color: "#fff" }}
                >
                  {step.n}
                </span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#2C2926" }}>
                    {step.title}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#7C7064" }}>
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Final CTA banner ── */}
        <section
          className="relative overflow-hidden mx-5 mb-12 rounded-3xl px-6 py-8 md:mx-16 lg:mx-24 xl:mx-32 md:py-12 flex flex-col items-center text-center gap-4"
          style={{ background: "#FBF8F3", border: "0.5px solid #EBE3D7" }}
        >
          <WarmGlow
            color="rose"
            size={300}
            opacity={0.1}
            className="absolute -top-10 pointer-events-none"
          />
          <p className="text-label-eyebrow">現在加入</p>
          <h2
            className="text-2xl font-bold"
            style={{ color: "#2C2926", letterSpacing: "-0.01em" }}
          >
            好奇自己幾分嗎？
          </h2>
          <p className="text-sm max-w-xs" style={{ color: "#7C7064" }}>
            找 100 個真人幫你打分，你在不同人眼中是什麼樣？每天都能看到自己的成長。
          </p>
          <GoogleSignInButton callbackUrl="/dashboard" />
          <p className="text-xs" style={{ color: "#B0A496" }}>
            免費 · 限 18 歲以上 · 看不到單一評分者
          </p>
        </section>
      </main>

      {/* ── Footer ── */}
      <SiteFooter />
    </div>
  );
}

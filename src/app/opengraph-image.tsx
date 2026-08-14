import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_NAME } from "@/lib/site";
import { logoMarkDataUri } from "@/lib/logo";

// 社群分享縮圖（Facebook / LINE / X / Threads 等）。
export const alt = "幾分 — 真人眼中的你，是幾分？";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// satori 預設字型不含中文字，必須載入內附的 Noto Sans TC 子集（建置時離線可用）。
export default async function OpengraphImage() {
  const [bold, medium] = await Promise.all([
    readFile(join(process.cwd(), "assets/NotoSansTC-Bold-subset.ttf")),
    readFile(join(process.cwd(), "assets/NotoSansTC-Medium-subset.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          backgroundColor: "#FBF8F3",
          backgroundImage:
            "radial-gradient(circle at 82% 18%, rgba(232,98,138,0.14), transparent 46%), radial-gradient(circle at 8% 92%, rgba(70,194,166,0.12), transparent 44%)",
          fontFamily: "Noto Sans TC",
        }}
      >
        {/* 品牌列：符號 + 字樣 */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={logoMarkDataUri()} width={76} height={76} alt="" />
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#2C2926",
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        {/* 主標 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 92,
              fontWeight: 700,
              color: "#2C2926",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            <span>真人眼中的你，</span>
            <span style={{ color: "#C0396B" }}>是幾分？</span>
          </div>
        </div>

        {/* 副標 */}
        <div
          style={{
            display: "flex",
            fontSize: 38,
            fontWeight: 500,
            color: "#7C7064",
          }}
        >
          分眾定位 · 進步追蹤 · 免費加入
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans TC", data: bold, weight: 700, style: "normal" },
        { name: "Noto Sans TC", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}

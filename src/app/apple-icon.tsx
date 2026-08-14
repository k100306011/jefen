import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/lib/logo";

// iOS「加入主畫面」圖示：奶油底圓角磚 + 品牌符號（iOS 會自動裁圓角）。
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const mark = logoMarkDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(150deg, #FBF8F3, #F1E9DC)",
        }}
      >
        <img src={mark} width={116} height={116} alt="幾分" />
      </div>
    ),
    { ...size },
  );
}

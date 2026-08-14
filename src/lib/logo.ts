// 幾分 品牌符號 — 三環分數計（呼應產品核心的 RingGauge）。
// 三段彩弧（玫瑰／金／青）由外而內收束到中心的莓紅點，像一個朝分數收斂的量表。
// 幾何常數集中在此，讓 <Logo>、favicon（icon.svg）、apple-icon、OG 圖都用「同一個」符號，不會走鐘。

export type LogoArc = { r: number; sw: number; color: string; progress: number };

export const LOGO_ARCS: LogoArc[] = [
  { r: 38, sw: 9, color: "#E8628A", progress: 0.76 }, // 外環：玫瑰
  { r: 26.5, sw: 8.5, color: "#EBA63E", progress: 0.72 }, // 中環：金
  { r: 15.5, sw: 8, color: "#46C2A6", progress: 0.8 }, // 內環：青
];

export const LOGO_DOT = { r: 4.5, color: "#C0396B" }; // 中心莓紅焦點

// 依半徑與進度算出 stroke-dasharray（用實際圓周長，任何 SVG 渲染器都吃得下，不依賴 pathLength）。
export function logoDash(r: number, progress: number): string {
  const c = 2 * Math.PI * r;
  return `${(c * progress).toFixed(2)} ${c.toFixed(2)}`;
}

// 產生完整 SVG 字串（供 icon.svg 靜態檔、以及 satori <img> data URI 使用）。
export function logoMarkSvg({ withDot = true }: { withDot?: boolean } = {}): string {
  const arcs = LOGO_ARCS.map(
    (a) =>
      `<circle cx="50" cy="50" r="${a.r}" stroke="${a.color}" stroke-width="${a.sw}" stroke-dasharray="${logoDash(
        a.r,
        a.progress,
      )}"/>`,
  ).join("");
  const dot = withDot
    ? `<circle cx="50" cy="50" r="${LOGO_DOT.r}" fill="${LOGO_DOT.color}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke-linecap="round" transform="rotate(-90 50 50)">${arcs}</g>${dot}</svg>`;
}

// 給 satori（OG 圖 / apple-icon）用的 base64 data URI。
export function logoMarkDataUri(opts?: { withDot?: boolean }): string {
  const base64 = Buffer.from(logoMarkSvg(opts)).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

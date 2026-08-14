import { LOGO_ARCS, LOGO_DOT, logoDash } from "@/lib/logo";

// 純 SVG 品牌符號（三環分數計）。伺服器元件即可，無需 client。
export function LogoMark({
  size = 36,
  withDot = true,
  className,
  title = "幾分",
}: {
  size?: number;
  withDot?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" strokeLinecap="round" transform="rotate(-90 50 50)">
        {LOGO_ARCS.map((a, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={a.r}
            stroke={a.color}
            strokeWidth={a.sw}
            strokeDasharray={logoDash(a.r, a.progress)}
          />
        ))}
      </g>
      {withDot && <circle cx="50" cy="50" r={LOGO_DOT.r} fill={LOGO_DOT.color} />}
    </svg>
  );
}

// 符號 + 「幾分」字樣的橫式 lockup。
export function Logo({
  size = 32,
  wordmark = true,
  wordmarkColor = "#2C2926",
  className,
}: {
  size?: number;
  wordmark?: boolean;
  wordmarkColor?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span
          className="font-extrabold"
          style={{
            fontSize: Math.round(size * 0.72),
            color: wordmarkColor,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          幾分
        </span>
      )}
    </span>
  );
}

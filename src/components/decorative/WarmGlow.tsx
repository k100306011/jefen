"use client";

interface WarmGlowProps {
  color?: "rose" | "gold" | "teal";
  size?: number;
  opacity?: number;
  className?: string;
}

const colorMap = {
  rose: ["#E8628A", "#D6356E"],
  gold: ["#EBA63E", "#E8628A"],
  teal: ["#46C2A6", "#EBA63E"],
};

export function WarmGlow({
  color = "rose",
  size = 400,
  opacity = 0.12,
  className = "",
}: WarmGlowProps) {
  const [c1, c2] = colorMap[color];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`wg-${color}-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c1} stopOpacity={opacity * 1.5} />
          <stop offset="50%" stopColor={c2} stopOpacity={opacity * 0.6} />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx={size / 2}
        cy={size / 2}
        rx={size / 2}
        ry={size / 2.2}
        fill={`url(#wg-${color}-${size})`}
      />
    </svg>
  );
}

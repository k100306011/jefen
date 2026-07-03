"use client";

interface HandSparkleProps {
  className?: string;
  color?: string;
  size?: number;
}

export function HandSparkle({
  className = "",
  color = "#EBA63E",
  size = 24,
}: HandSparkleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* 4-pointed star sparkle */}
      <path
        d="M12 2 L13.2 9.5 L20 8 L13.8 12 L20 16 L13.2 14.5 L12 22 L10.8 14.5 L4 16 L10.2 12 L4 8 L10.8 9.5 Z"
        fill={color}
        fillOpacity="0.9"
      />
      {/* small accent dots */}
      <circle cx="5" cy="5" r="1.2" fill={color} fillOpacity="0.6" />
      <circle cx="19" cy="19" r="1" fill={color} fillOpacity="0.5" />
      <circle cx="20" cy="6" r="0.8" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

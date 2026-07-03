"use client";

interface SquiggleUnderlineProps {
  width?: number;
  className?: string;
  color?: string;
}

export function SquiggleUnderline({
  width = 120,
  className = "",
  color = "#E8628A",
}: SquiggleUnderlineProps) {
  const height = 10;
  // Generate a wavy path
  const path = `M0,${height / 2} C${width * 0.12},0 ${width * 0.25},${height} ${width * 0.38},${height / 2} C${width * 0.5},0 ${width * 0.62},${height} ${width * 0.75},${height / 2} C${width * 0.87},0 ${width},${height} ${width},${height / 2}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

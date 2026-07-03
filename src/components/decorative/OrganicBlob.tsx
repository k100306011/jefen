"use client";

interface OrganicBlobProps {
  color?: "rose" | "gold" | "teal";
  opacity?: number;
  className?: string;
  size?: number;
}

const colorMap = {
  rose: "#E8628A",
  gold: "#EBA63E",
  teal: "#46C2A6",
};

export function OrganicBlob({
  color = "rose",
  opacity = 0.08,
  className = "",
  size = 320,
}: OrganicBlobProps) {
  const fill = colorMap[color];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M47.5,-62.3C60.7,-53.4,70,-38.2,74.3,-21.8C78.6,-5.4,77.8,12.2,71.3,27.2C64.8,42.3,52.5,54.8,38.1,62.1C23.7,69.3,7.1,71.2,-9.1,69.2C-25.4,67.1,-41.5,61.1,-53.7,50.3C-65.9,39.5,-74.2,24,-76.1,7.3C-78.1,-9.4,-73.7,-27.3,-64.1,-41C-54.5,-54.6,-39.7,-64,-24.9,-70.2C-10.2,-76.5,4.5,-79.5,18.2,-75.8C31.9,-72.2,34.4,-71.3,47.5,-62.3Z"
        transform="translate(100 100)"
        fill={fill}
        fillOpacity={opacity}
      />
    </svg>
  );
}

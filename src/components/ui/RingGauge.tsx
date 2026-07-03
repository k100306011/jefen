"use client";

import { motion } from "framer-motion";

interface RingData {
  value: number; // 0–10
  color: string;
  label: string;
}

interface RingGaugeProps {
  rings: [RingData, RingData, RingData]; // exactly 3 rings
  centerScore: number;
  percentileRank: number;
  size?: number;
  animated?: boolean;
}

function RingArc({
  cx,
  cy,
  r,
  value,
  color,
  strokeWidth,
  trackColor,
  animated,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  value: number; // 0–10
  color: string;
  strokeWidth: number;
  trackColor: string;
  animated: boolean;
  delay: number;
}) {
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(value / 10, 1);
  const dashArray = circumference;
  const dashOffset = circumference * (1 - progress);

  return (
    <g>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Fill arc */}
      {animated ? (
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          initial={{ strokeDashoffset: dashArray }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, delay, ease: [0.34, 1.56, 0.64, 1] }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
    </g>
  );
}

export function RingGauge({
  rings,
  centerScore,
  percentileRank,
  size = 200,
  animated = false,
}: RingGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const trackColor = "#EFE8DB";

  // Three rings, outermost to innermost
  const ringConfigs = [
    { r: size * 0.42, strokeWidth: size * 0.07 },
    { r: size * 0.31, strokeWidth: size * 0.065 },
    { r: size * 0.20, strokeWidth: size * 0.06 },
  ];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, i) => (
          <RingArc
            key={i}
            cx={cx}
            cy={cy}
            r={ringConfigs[i].r}
            value={ring.value}
            color={ring.color}
            strokeWidth={ringConfigs[i].strokeWidth}
            trackColor={trackColor}
            animated={animated}
            delay={i * 0.15}
          />
        ))}
      </svg>

      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span
          className="font-bold leading-none"
          style={{
            fontSize: size * 0.18,
            color: "#2C2926",
            letterSpacing: "-0.02em",
          }}
        >
          {centerScore.toFixed(1)}
        </span>
        <span
          className="mt-1"
          style={{
            fontSize: size * 0.075,
            color: "#9C8E7E",
            lineHeight: 1.2,
          }}
        >
          贏過同齡
        </span>
        <span
          className="font-semibold"
          style={{
            fontSize: size * 0.09,
            color: "#D6356E",
            lineHeight: 1.2,
          }}
        >
          {percentileRank}%
        </span>
      </div>
    </div>
  );
}

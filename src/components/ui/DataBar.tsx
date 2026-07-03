"use client";

import { motion } from "framer-motion";

interface DataBarProps {
  label: string;
  value: number; // 0–10
  color: string;
  animated?: boolean;
  delay?: number;
  showValue?: boolean;
}

export function DataBar({
  label,
  value,
  color,
  animated = false,
  delay = 0,
  showValue = true,
}: DataBarProps) {
  const pct = `${(value / 10) * 100}%`;

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-20 shrink-0 text-right text-sm"
        style={{ color: "#9C8E7E" }}
      >
        {label}
      </span>
      <div
        className="relative flex-1 rounded-full overflow-hidden"
        style={{ height: 8, background: "#EFE8DB" }}
      >
        {animated ? (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: pct }}
            transition={{
              duration: 1,
              delay,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        ) : (
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: color, width: pct }}
          />
        )}
      </div>
      {showValue && (
        <span
          className="w-8 shrink-0 text-sm font-medium"
          style={{ color: "#2C2926" }}
        >
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

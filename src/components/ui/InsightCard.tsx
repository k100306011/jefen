"use client";

import { motion } from "framer-motion";

interface InsightCardProps {
  tagLabel: string;
  tagColor: string;
  metricValue: string;
  metricUnit?: string;
  description: string;
  animated?: boolean;
  delay?: number;
  className?: string;
}

export function InsightCard({
  tagLabel,
  tagColor,
  metricValue,
  metricUnit,
  description,
  animated = false,
  delay = 0,
  className = "",
}: InsightCardProps) {
  const Wrapper = animated ? motion.div : "div";
  const motionProps = animated
    ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] },
      }
    : {};

  return (
    <Wrapper
      {...(motionProps as object)}
      className={`card-surface p-5 flex flex-col gap-2 ${className}`}
    >
      {/* Colored tag */}
      <span
        className="self-start rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{ background: `${tagColor}18`, color: tagColor }}
      >
        {tagLabel}
      </span>

      {/* Big metric */}
      <div className="flex items-baseline gap-1">
        <span
          className="font-bold leading-none"
          style={{ fontSize: "2rem", color: "#2C2926", letterSpacing: "-0.02em" }}
        >
          {metricValue}
        </span>
        {metricUnit && (
          <span className="text-sm font-medium" style={{ color: "#5C5248" }}>
            {metricUnit}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm leading-snug" style={{ color: "#7C7064" }}>
        {description}
      </p>
    </Wrapper>
  );
}

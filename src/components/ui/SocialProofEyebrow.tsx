"use client";

import { motion } from "framer-motion";

interface SocialProofEyebrowProps {
  count: number;
  className?: string;
}

export function SocialProofEyebrow({ count, className = "" }: SocialProofEyebrowProps) {
  const formatted = count.toLocaleString("zh-TW");

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${className}`}
      style={{ background: "#FBF8F3", border: "0.5px solid #EBE3D7" }}
    >
      {/* Breathing dot */}
      <motion.span
        className="block h-2 w-2 rounded-full"
        style={{ background: "#C0396B" }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="text-xs font-medium" style={{ color: "#5C5248" }}>
        今晚 <span className="font-semibold" style={{ color: "#C0396B" }}>{formatted}</span> 人正在被評分
      </span>
    </div>
  );
}

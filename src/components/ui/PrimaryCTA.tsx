"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PrimaryCTAProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export function PrimaryCTA({
  children,
  onClick,
  icon,
  disabled = false,
  loading = false,
  className = "",
  type = "button",
}: PrimaryCTAProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2.5 rounded-2xl px-7 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-60 ${className}`}
      style={{ background: "#C0396B", minWidth: 240 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}

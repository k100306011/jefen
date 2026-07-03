"use client";

import { RingGauge } from "./RingGauge";
import { DataBar } from "./DataBar";
import { WarmGlow } from "@/components/decorative/WarmGlow";
import { OrganicBlob } from "@/components/decorative/OrganicBlob";
import { HandSparkle } from "@/components/decorative/HandSparkle";

const previewRings: [
  { value: number; color: string; label: string },
  { value: number; color: string; label: string },
  { value: number; color: string; label: string }
] = [
  { value: 7.8, color: "#E8628A", label: "女生" },
  { value: 7.4, color: "#EBA63E", label: "25–30" },
  { value: 8.1, color: "#46C2A6", label: "中南部" },
];

const bars = [
  { label: "女生眼中", value: 7.8, color: "#E8628A" },
  { label: "男生眼中", value: 7.0, color: "#EBA63E" },
  { label: "中南部", value: 8.1, color: "#46C2A6" },
];

export function HeroDashboard() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #EBE3D7",
        boxShadow: "0 8px 40px rgba(44,41,38,0.08)",
      }}
    >
      {/* Decorative layers */}
      <WarmGlow
        color="rose"
        size={280}
        opacity={0.1}
        className="absolute -top-16 -right-16"
      />
      <OrganicBlob
        color="gold"
        opacity={0.06}
        size={180}
        className="absolute -bottom-8 -left-8"
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#9C8E7E" }}>
            我的定位
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "#2C2926" }}>
            247 人評分
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: "#EAEFE2" }}
        >
          <span className="text-xs font-semibold" style={{ color: "#5E7A4E" }}>
            ↑ +0.3
          </span>
          <span className="text-xs" style={{ color: "#7C7064" }}>
            比上批
          </span>
        </div>
      </div>

      {/* Ring gauge */}
      <div className="relative flex justify-center my-4">
        <RingGauge
          rings={previewRings}
          centerScore={7.4}
          percentileRank={72}
          size={170}
          animated={false}
        />
        <HandSparkle
          className="absolute top-0 right-6"
          color="#EBA63E"
          size={20}
        />
      </div>

      {/* Ring legend */}
      <div className="flex justify-center gap-4 mb-5">
        {previewRings.map((r) => (
          <div key={r.label} className="flex items-center gap-1">
            <span
              className="block h-2 w-2 rounded-full"
              style={{ background: r.color }}
            />
            <span className="text-xs" style={{ color: "#9C8E7E" }}>
              {r.label}
            </span>
          </div>
        ))}
      </div>

      {/* Data bars */}
      <div className="flex flex-col gap-3">
        {bars.map((b, i) => (
          <DataBar
            key={b.label}
            label={b.label}
            value={b.value}
            color={b.color}
            animated={false}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Bottom detail */}
      <p className="mt-4 text-xs text-center" style={{ color: "#B0A496" }}>
        真人互評 · 每晚 21:00 更新 · n=247
      </p>
    </div>
  );
}

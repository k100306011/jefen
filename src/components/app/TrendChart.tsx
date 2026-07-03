"use client";

import { motion } from "framer-motion";

export interface TrendPoint {
  date: string; // 已格式化的日期標籤
  score: number; // 0–10
}

// 輕量 SVG 折線圖：歷次揭曉的平均分走勢
export function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) return null;

  const W = 560;
  const H = 140;
  const PAD = { top: 14, right: 16, bottom: 24, left: 30 };

  const scores = points.map((p) => p.score);
  const min = Math.max(0, Math.floor(Math.min(...scores)) - 1);
  const max = Math.min(10, Math.ceil(Math.max(...scores)) + 1);

  const x = (i: number) =>
    PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (s: number) =>
    PAD.top + (1 - (s - min) / (max - min)) * (H - PAD.top - PAD.bottom);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`)
    .join(" ");

  const area = `${path} L${x(points.length - 1).toFixed(1)},${H - PAD.bottom} L${PAD.left},${H - PAD.bottom} Z`;

  const first = points[0].score;
  const last = points[points.length - 1].score;
  const delta = Math.round((last - first) * 10) / 10;

  return (
    <div className="card-surface flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-label-eyebrow">分數走勢</p>
        {delta !== 0 && (
          <span
            className="growth-pill"
            style={delta < 0 ? { background: "#F6E2E8", color: "#C0396B" } : undefined}
          >
            {delta > 0 ? "↑ +" : "↓ "}
            {delta.toFixed(1)} 自首次揭曉
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="分數走勢圖">
        {/* 水平格線 */}
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="#EFE8DB"
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={y(v) + 3.5} textAnchor="end" fontSize={10} fill="#B0A496">
              {v}
            </text>
          </g>
        ))}

        {/* 面積 + 折線 */}
        <path d={area} fill="#E8628A" opacity={0.08} />
        <motion.path
          d={path}
          fill="none"
          stroke="#C0396B"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* 資料點 */}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.score)} r={3.5} fill="#C0396B" />
        ))}

        {/* 首尾日期標籤 */}
        <text x={PAD.left} y={H - 6} fontSize={10} fill="#B0A496">
          {points[0].date}
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize={10} fill="#B0A496">
          {points[points.length - 1].date}
        </text>
      </svg>
    </div>
  );
}

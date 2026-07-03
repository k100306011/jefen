"use client";

import { RingGauge } from "@/components/ui/RingGauge";
import { DataBar } from "@/components/ui/DataBar";
import { InsightCard } from "@/components/ui/InsightCard";
import type { ResultBatch, DemographicBreakdown } from "@/types";

const CONFIDENCE_LABEL: Record<ResultBatch["confidence"], string> = {
  low: "樣本較少，僅供參考",
  medium: "樣本中等",
  high: "樣本充足，可信度高",
};

function ringFor(
  list: DemographicBreakdown[],
  fallbackScore: number,
  fallbackLabel: string,
  color: string,
) {
  const top = list[0];
  return {
    value: top?.score ?? fallbackScore,
    color: top?.color ?? color,
    label: top?.label ?? fallbackLabel,
  };
}

function deriveInsights(batch: ResultBatch) {
  const cards: {
    tagLabel: string;
    tagColor: string;
    metricValue: string;
    metricUnit?: string;
    description: string;
  }[] = [];

  const all = [...batch.byGender, ...batch.byAge, ...batch.byRegion];
  const top = [...all].sort((a, b) => b.score - a.score)[0];
  if (top) {
    cards.push({
      tagLabel:
        top.dimension === "gender" ? "性別分眾" : top.dimension === "age" ? "年齡分眾" : "地區分眾",
      tagColor: top.color,
      metricValue: top.score.toFixed(1),
      metricUnit: top.label,
      description: `在「${top.label}」族群中你拿到最高分，這是最買單你的人。`,
    });
  }

  if (batch.byGender.length >= 2) {
    const sorted = [...batch.byGender].sort((a, b) => b.score - a.score);
    const diff = Math.round((sorted[0].score - sorted[1].score) * 10) / 10;
    if (diff > 0) {
      cards.push({
        tagLabel: "性別差異",
        tagColor: "#E8628A",
        metricValue: `+${diff.toFixed(1)}`,
        metricUnit: sorted[0].label,
        description: `${sorted[0].label}給你的分數比${sorted[1].label}高 ${diff.toFixed(1)} 分。`,
      });
    }
  }

  cards.push({
    tagLabel: "整體定位",
    tagColor: "#46C2A6",
    metricValue: `${batch.percentileRank}%`,
    metricUnit: "百分位",
    description: `你的平均分贏過約 ${batch.percentileRank}% 的人。`,
  });

  return cards.slice(0, 3);
}

function BreakdownSection({
  title,
  items,
}: {
  title: string;
  items: DemographicBreakdown[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-label-eyebrow">{title}</p>
      {items.map((b, i) => (
        <DataBar key={`${b.label}-${i}`} label={b.label} value={b.score} color={b.color} animated delay={i * 0.08} />
      ))}
    </div>
  );
}

export function ResultCard({
  batch,
  label,
}: {
  batch: ResultBatch;
  label?: string | null;
}) {
  const rings: [
    { value: number; color: string; label: string },
    { value: number; color: string; label: string },
    { value: number; color: string; label: string },
  ] = [
    ringFor(batch.byGender, batch.averageScore, "整體", "#E8628A"),
    ringFor(batch.byAge, batch.averageScore, "整體", "#EBA63E"),
    ringFor(batch.byRegion, batch.averageScore, "整體", "#46C2A6"),
  ];

  const insights = deriveInsights(batch);

  return (
    <div className="card-surface flex flex-col gap-6 p-6">
      {label && (
        <span
          className="self-start rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "#EBE3D7", color: "#5C5248" }}
        >
          {label}
        </span>
      )}

      <div className="flex flex-col items-center gap-3">
        <RingGauge
          rings={rings}
          centerScore={batch.averageScore}
          percentileRank={batch.percentileRank}
          size={200}
          animated
        />
        <div className="flex flex-wrap justify-center gap-3">
          {rings.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
              <span className="text-xs" style={{ color: "#9C8E7E" }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: "#B0A496" }}>
          {batch.totalRatings} 人評分 · {CONFIDENCE_LABEL[batch.confidence]}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <BreakdownSection title="不同性別眼中" items={batch.byGender} />
        <BreakdownSection title="不同年齡眼中" items={batch.byAge} />
        <BreakdownSection title="不同地區眼中" items={batch.byRegion} />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-label-eyebrow">你的洞察</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((c, i) => (
            <InsightCard
              key={i}
              tagLabel={c.tagLabel}
              tagColor={c.tagColor}
              metricValue={c.metricValue}
              metricUnit={c.metricUnit}
              description={c.description}
              animated
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { completeOnboarding, type ActionState } from "@/lib/actions";
import { GENDER_OPTIONS, AGE_OPTIONS, REGION_OPTIONS } from "@/lib/constants";
import { PrimaryCTA } from "@/components/ui/PrimaryCTA";
import { SquiggleUnderline } from "@/components/decorative/SquiggleUnderline";

function OptionChips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-full px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: active ? "#C0396B" : "#FFFFFF",
              color: active ? "#fff" : "#5C5248",
              border: active ? "1px solid #C0396B" : "0.5px solid #EBE3D7",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const initialState: ActionState = {};

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, initialState);
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [region, setRegion] = useState("");

  const ready = gender && ageRange && region;

  return (
    <form action={action} className="relative card-surface p-7 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#2C2926" }}>
          建立你的檔案
        </h1>
        <SquiggleUnderline width={70} color="#E8628A" className="mt-2" />
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#7C7064" }}>
          這些資訊只用來做分眾統計，幫你看清自己在不同人眼中的樣子，不會公開。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-label-eyebrow">性別</p>
        <OptionChips options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        <input type="hidden" name="gender" value={gender} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-label-eyebrow">年齡</p>
        <OptionChips options={AGE_OPTIONS} value={ageRange} onChange={setAgeRange} />
        <input type="hidden" name="ageRange" value={ageRange} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-label-eyebrow">所在地區</p>
        <OptionChips options={REGION_OPTIONS} value={region} onChange={setRegion} />
        <input type="hidden" name="region" value={region} />
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          name="verify18"
          className="mt-0.5 h-4 w-4 accent-[#C0396B]"
        />
        <span className="text-sm" style={{ color: "#5C5248" }}>
          我確認我已年滿 18 歲，並同意以匿名方式互相評分。
        </span>
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "#D6356E" }}>
          {state.error}
        </p>
      )}

      <PrimaryCTA type="submit" loading={pending} disabled={!ready} className="w-full">
        完成，開始
      </PrimaryCTA>
    </form>
  );
}

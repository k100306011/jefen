"use client";

import { useActionState, useState } from "react";
import { signOut } from "next-auth/react";
import {
  updateProfile,
  deleteAccount,
  type ActionState,
} from "@/lib/actions";
import { GENDER_OPTIONS, AGE_OPTIONS, REGION_OPTIONS } from "@/lib/constants";
import { PrimaryCTA } from "@/components/ui/PrimaryCTA";

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

export function SettingsForm({
  initial,
}: {
  initial: {
    name: string;
    email: string;
    gender: string;
    ageRange: string;
    region: string;
  };
}) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  const [gender, setGender] = useState(initial.gender);
  const [ageRange, setAgeRange] = useState(initial.ageRange);
  const [region, setRegion] = useState(initial.region);

  return (
    <form action={action} className="card-surface p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-label-eyebrow" htmlFor="name">
          暱稱
        </label>
        <input
          id="name"
          name="name"
          defaultValue={initial.name}
          maxLength={30}
          className="rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ border: "0.5px solid #EBE3D7", background: "#fff", color: "#2C2926" }}
        />
        <p className="text-xs" style={{ color: "#B0A496" }}>
          帳號：{initial.email}
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

      <p className="text-xs leading-relaxed" style={{ color: "#B0A496" }}>
        修改後只影響你之後給出的評分快照；別人已給你的歷史結果不會改變。
      </p>

      {state.error && (
        <p className="text-sm" style={{ color: "#D6356E" }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm" style={{ color: "#5E7A4E" }}>
          已儲存
        </p>
      )}

      <PrimaryCTA type="submit" loading={pending} className="w-full">
        儲存變更
      </PrimaryCTA>
    </form>
  );
}

export function DangerZone() {
  const [state, action, pending] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await deleteAccount(prev, fd);
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      }
      return res;
    },
    initialState,
  );
  const [confirm, setConfirm] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="card-surface w-full py-3 text-sm font-semibold"
        style={{ color: "#5C5248" }}
      >
        登出
      </button>

      <form
        action={action}
        className="card-surface flex flex-col gap-3 p-5"
        style={{ borderColor: "#EDC8D4" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#C0396B" }}>
          刪除帳號
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#7C7064" }}>
          會永久刪除你的照片、收到與給出的評分及所有結果，無法復原。輸入
          <span className="font-mono font-semibold"> DELETE </span>確認。
        </p>
        <div className="flex gap-2">
          <input
            name="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ border: "0.5px solid #EBE3D7", background: "#fff", color: "#2C2926" }}
          />
          <button
            type="submit"
            disabled={pending || confirm !== "DELETE"}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: "#C0396B" }}
          >
            {pending ? "刪除中…" : "永久刪除"}
          </button>
        </div>
        {state.error && (
          <p className="text-xs" style={{ color: "#D6356E" }}>
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}

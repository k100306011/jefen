"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

// 僅開發 / demo 使用：用任意 email 直接登入。
export function DevLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email.includes("@")) return;
    setLoading(true);
    await signIn("dev", { email, callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-center text-xs" style={{ color: "#B0A496" }}>
        — 開發測試登入 —
      </p>
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="dev@example.com"
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
          style={{ border: "0.5px solid #EBE3D7", background: "#fff", color: "#2C2926" }}
        />
        <button
          type="button"
          onClick={handle}
          disabled={loading || !email.includes("@")}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#5C5248" }}
        >
          登入
        </button>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getRatingQueue,
  getRatingProgress,
} from "@/lib/queries";
import { RatingDeck } from "@/components/app/RatingDeck";

export const dynamic = "force-dynamic";

export default async function RatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [queue, progress] = await Promise.all([
    getRatingQueue(user.id, 15),
    getRatingProgress(user.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#2C2926" }}>
          幫別人評分
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#7C7064" }}>
          1:1 互惠——你評越多人，就有越多人評你，也越快解鎖自己的結果。
        </p>
      </div>

      <RatingDeck
        key={queue.map((p) => p.id).join(",") || "empty"}
        queue={queue.map((p) => ({ id: p.id, label: p.label }))}
        given={progress.given}
        needed={progress.needed}
      />
    </div>
  );
}

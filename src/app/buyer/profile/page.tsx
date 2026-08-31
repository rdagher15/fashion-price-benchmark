import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import LogoutButton from "@/components/LogoutButton";
import { BUYER_TYPES } from "@/lib/constants";

export default async function BuyerProfilePage() {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const [locations, reviews] = await Promise.all([
    prisma.buyerDeliveryLocation.findMany({ where: { buyerProfileId: profile.id } }),
    prisma.review.findMany({ where: { reviewedPartyId: user!.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const typeLabel = BUYER_TYPES.find((t) => t.value === profile.buyerType)?.label || profile.buyerType;

  return (
    <div>
      <TopBar title="My Profile" />
      <div className="space-y-4 px-4 py-4">
        <div className="card">
          <p className="text-lg font-bold">{profile.businessName}</p>
          <p className="text-sm text-gray-500">{typeLabel} · {profile.city}, {profile.region}</p>
          <div className="mt-2 flex gap-4 text-sm">
            <span>⭐ {profile.ratingAvg.toFixed(1)} ({profile.ratingCount})</span>
            <span>✅ {profile.completedOrders} completed orders</span>
          </div>
          <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
            {profile.verificationStatus === "VERIFIED" ? "✅ Verified" : "Verification pending"}
          </span>
        </div>

        <div className="card space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Delivery locations</h3>
          {locations.map((l) => (
            <div key={l.id} className="border-b border-gray-50 pb-2 text-sm last:border-0">
              <p className="font-medium">{l.label}{l.isPrimary ? " (primary)" : ""}</p>
              <p className="text-gray-500">{l.address}</p>
            </div>
          ))}
        </div>

        {reviews.length > 0 && (
          <div className="card space-y-2">
            <h3 className="text-sm font-bold text-gray-800">Recent reviews</h3>
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-50 pb-2 text-sm last:border-0">
                <p>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                {r.comment && <p className="text-gray-500">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <LogoutButton />
      </div>
    </div>
  );
}

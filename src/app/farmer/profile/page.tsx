import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import LogoutButton from "@/components/LogoutButton";
import FarmerProfileEditor from "@/components/FarmerProfileEditor";

export default async function FarmerProfilePage() {
  const user = await getCurrentUser();
  const profile = user!.farmerProfile!;

  const [photos, reviews] = await Promise.all([
    prisma.farmPhoto.findMany({ where: { farmerProfileId: profile.id } }),
    prisma.review.findMany({ where: { reviewedPartyId: user!.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const supportTypes: string[] = JSON.parse(profile.supportTypesJson || "[]");

  return (
    <div>
      <TopBar title="My Profile" />
      <div className="space-y-4 px-4 py-4">
        <div className="card">
          <p className="text-lg font-bold">{profile.farmName}</p>
          <p className="text-sm text-gray-500">{user!.firstName} {user!.lastName} · {profile.city}, {profile.region}</p>
          <div className="mt-2 flex gap-4 text-sm">
            <span>⭐ {profile.ratingAvg.toFixed(1)} ({profile.ratingCount})</span>
            <span>✅ {profile.completedOrders} completed orders</span>
          </div>
          <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
            {profile.verificationStatus === "VERIFIED" ? "✅ Verified" : "Verification pending"}
          </span>
        </div>

        <div className="card space-y-1 text-sm">
          <Row label="Farm size" value={profile.farmSizeValue ? `${profile.farmSizeValue} ${profile.farmSizeUnit}` : "—"} />
          <Row label="Farm type" value={profile.farmType || "—"} />
          <Row label="Years operating" value={profile.yearsOperating ? String(profile.yearsOperating) : "—"} />
          <Row label="Delivery" value={profile.hasOwnVehicle ? `Own vehicle (${profile.vehicleType || "—"})` : "Pickup / shared delivery"} />
        </div>

        <FarmerProfileEditor
          supportTypes={supportTypes}
          supportDescription={profile.supportDescription || ""}
          usesPesticides={profile.usesPesticides}
          usesFertilizers={profile.usesFertilizers}
          organic={profile.organic}
          farmingNotes={profile.farmingNotes || ""}
          photos={photos}
        />

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-50 py-1 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

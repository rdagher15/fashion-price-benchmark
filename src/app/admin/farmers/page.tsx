import { prisma } from "@/lib/db";
import { SuspendToggle, VerifyToggle } from "@/components/AdminActions";

export default async function AdminFarmersPage() {
  const farmers = await prisma.farmerProfile.findMany({
    include: { user: true, listings: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Farmers ({farmers.length})</h1>
      <div className="space-y-2">
        {farmers.map((f) => (
          <div key={f.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{f.farmName}</p>
                <p className="text-xs text-gray-500">{f.user.firstName} {f.user.lastName} · {f.user.email}</p>
                <p className="text-xs text-gray-500">{f.city}, {f.region} · {f.listings.length} listing(s)</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${f.user.status === "SUSPENDED" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>{f.user.status}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <VerifyToggle profileId={f.id} verificationStatus={f.verificationStatus} kind="farmers" />
              <SuspendToggle userId={f.userId} status={f.user.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

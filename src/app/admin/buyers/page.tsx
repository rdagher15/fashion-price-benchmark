import { prisma } from "@/lib/db";
import { SuspendToggle, VerifyToggle } from "@/components/AdminActions";
import { BUYER_TYPES } from "@/lib/constants";

export default async function AdminBuyersPage() {
  const buyers = await prisma.buyerProfile.findMany({
    include: { user: true, requirements: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Buyers ({buyers.length})</h1>
      <div className="space-y-2">
        {buyers.map((b) => (
          <div key={b.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{b.businessName}</p>
                <p className="text-xs text-gray-500">{BUYER_TYPES.find((t) => t.value === b.buyerType)?.label || b.buyerType} · {b.user.email}</p>
                <p className="text-xs text-gray-500">{b.city}, {b.region} · {b.requirements.length} requirement(s)</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.user.status === "SUSPENDED" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>{b.user.status}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <VerifyToggle profileId={b.id} verificationStatus={b.verificationStatus} kind="buyers" />
              <SuspendToggle userId={b.userId} status={b.user.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

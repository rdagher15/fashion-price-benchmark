import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/StatusPill";
import { formatDate } from "@/lib/format";

export default async function AdminRequirementsPage() {
  const requirements = await prisma.requirement.findMany({
    include: { produceCategory: true, buyerProfile: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Requirements ({requirements.length})</h1>
      <div className="space-y-2">
        {requirements.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{r.produceCategory.name} · {r.buyerProfile.businessName}</p>
                <p className="text-xs text-gray-500">{r.quantity} {r.unit} by {formatDate(r.requiredDate)} → {r.deliveryLocationLabel}</p>
              </div>
              <StatusPill status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

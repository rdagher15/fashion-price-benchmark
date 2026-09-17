import { prisma } from "@/lib/db";
import { matchLabel } from "@/lib/matching";

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    include: {
      listing: { include: { produceCategory: true, farmerProfile: true } },
      requirement: { include: { buyerProfile: true } },
    },
    orderBy: { score: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Matches ({matches.length})</h1>
      <div className="space-y-2">
        {matches.map((m) => (
          <div key={m.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{m.listing.farmerProfile.farmName} ↔ {m.requirement.buyerProfile.businessName}</p>
                <p className="text-xs text-gray-500">{m.listing.produceCategory.name} · produce {m.produceScore} qty {m.quantityScore} date {m.dateScore} geo {m.geoScore} delivery {m.deliveryScore} price {m.priceScore}</p>
              </div>
              <span className="text-xs font-bold text-brand-700">{Math.round(m.score)}% {matchLabel(m.score)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

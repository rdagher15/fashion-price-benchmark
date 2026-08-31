import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function AdminOffersPage() {
  const offers = await prisma.offer.findMany({
    include: { listing: { include: { produceCategory: true } }, buyerProfile: true, farmerProfile: true, negotiations: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Offers ({offers.length})</h1>
      <div className="space-y-2">
        {offers.map((o) => (
          <div key={o.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{o.buyerProfile.businessName} → {o.farmerProfile.farmName}</p>
                <p className="text-xs text-gray-500">{o.listing.produceCategory.name} · {o.quantity} @ {formatMoney(o.price)}/{o.priceUnit} · {o.negotiations.length} negotiation round(s)</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

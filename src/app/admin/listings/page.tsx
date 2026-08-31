import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    include: { produceCategory: true, farmerProfile: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Listings ({listings.length})</h1>
      <div className="space-y-2">
        {listings.map((l) => (
          <div key={l.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{l.produceCategory.name} · {l.farmerProfile.farmName}</p>
                <p className="text-xs text-gray-500">{l.quantity} {l.unit} · {formatMoney(l.minPrice)}/{l.priceUnit} · {formatDate(l.availableFrom)}–{formatDate(l.availableUntil)}</p>
              </div>
              <StatusPill status={l.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

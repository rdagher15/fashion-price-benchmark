import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { formatDate, formatMoney } from "@/lib/format";
import { haversineKm } from "@/lib/geo";
import SearchFilters from "@/components/SearchFilters";
import { LISTING_STATUS } from "@/lib/constants";

export default async function BuyerSearchPage({ searchParams }: { searchParams: { produce?: string; organic?: string; maxPrice?: string; sort?: string } }) {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const [categories, listings] = await Promise.all([
    prisma.produceCategory.findMany({ where: { active: true }, orderBy: [{ family: "asc" }, { name: "asc" }] }),
    prisma.listing.findMany({
      where: {
        status: { in: [LISTING_STATUS.PUBLISHED, LISTING_STATUS.OFFERS_RECEIVED] },
        produceCategoryId: searchParams.produce || undefined,
        productionMethod: searchParams.organic === "1" ? "organic" : undefined,
        minPrice: searchParams.maxPrice ? { lte: Number(searchParams.maxPrice) } : undefined,
      },
      include: { produceCategory: true, farmerProfile: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let decorated = listings.map((l) => ({
    ...l,
    distanceKm: haversineKm(l.farmerProfile.latitude, l.farmerProfile.longitude, profile.latitude, profile.longitude),
  }));

  if (searchParams.sort === "price") decorated.sort((a, b) => a.minPrice - b.minPrice);
  else if (searchParams.sort === "distance") decorated.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
  else decorated.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <TopBar title="Find Produce" />
      <div className="space-y-3 px-4 py-4">
        <SearchFilters categories={categories} />

        {decorated.length === 0 && <p className="pt-8 text-center text-sm text-gray-400">No listings match your filters.</p>}

        {decorated.map((l) => {
          const methods: string[] = JSON.parse(l.deliveryMethodsJson || "[]");
          return (
            <div key={l.id} className="card">
              {l.photoUrl && <img src={l.photoUrl} className="mb-2 h-32 w-full rounded-lg object-cover" alt="" />}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{l.farmerProfile.farmName}</p>
                  <p className="text-xs text-gray-500">{l.produceCategory.name}{l.variety ? ` — ${l.variety}` : ""} · {l.productionMethod}</p>
                </div>
                {l.distanceKm != null && <span className="text-xs font-semibold text-gray-500">{l.distanceKm} km</span>}
              </div>
              <p className="mt-1 text-sm">{l.quantity} {l.unit} available</p>
              <p className="text-sm font-semibold text-brand-700">{formatMoney(l.minPrice)}{l.maxPrice ? `–${formatMoney(l.maxPrice)}` : ""}/{l.priceUnit}</p>
              <p className="text-xs text-gray-500">Available {formatDate(l.availableFrom)}–{formatDate(l.availableUntil)}</p>
              {methods.includes("farmer_delivery") && <p className="text-xs text-brand-600">🚚 Farmer delivery available</p>}
              <Link href={`/buyer/offers/new?listingId=${l.id}`} className="btn-secondary mt-2 block text-center !py-2">View & Make an Offer</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

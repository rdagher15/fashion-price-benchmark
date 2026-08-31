import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney } from "@/lib/format";
import { matchLabel } from "@/lib/matching";

export default async function FarmerListingDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = user!.farmerProfile!;

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      produceCategory: true,
      offers: { include: { buyerProfile: true }, orderBy: { createdAt: "desc" } },
      matches: { include: { requirement: { include: { buyerProfile: true } } }, orderBy: { score: "desc" } },
    },
  });
  if (!listing) notFound();
  if (listing.farmerProfileId !== profile.id) redirect("/farmer/listings");

  const methods: string[] = JSON.parse(listing.deliveryMethodsJson || "[]");

  return (
    <div>
      <TopBar title={listing.produceCategory.name} subtitle={listing.variety || undefined} backHref="/farmer/listings" />
      <div className="space-y-4 px-4 py-4">
        {listing.photoUrl && <img src={listing.photoUrl} className="h-40 w-full rounded-xl object-cover" alt="" />}

        <div className="flex items-center justify-between">
          <StatusPill status={listing.status} />
          <span className="text-xs text-gray-400">Listed {formatDate(listing.createdAt)}</span>
        </div>

        <div className="card space-y-1 text-sm">
          <Row label="Quantity" value={`${listing.quantity} ${listing.unit}${listing.minOrderQuantity ? ` (min order ${listing.minOrderQuantity})` : ""}`} />
          <Row label="Availability" value={`${formatDate(listing.availableFrom)} – ${formatDate(listing.availableUntil)}`} />
          <Row label="Price range" value={`${formatMoney(listing.minPrice)}${listing.maxPrice ? ` – ${formatMoney(listing.maxPrice)}` : ""} / ${listing.priceUnit}`} />
          <Row label="Quality" value={[listing.grade, listing.qualityLevel, listing.productionMethod].filter(Boolean).join(" · ") || "—"} />
          <Row label="Packaging" value={listing.packagingType || "—"} />
          <Row label="Delivery" value={methods.join(", ") || "—"} />
        </div>

        {listing.offers.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Offers ({listing.offers.length})</h2>
            <div className="space-y-2">
              {listing.offers.map((o) => (
                <Link key={o.id} href={`/farmer/offers/${o.id}`} className="card block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{o.buyerProfile.businessName}</p>
                    <span className="text-xs font-bold text-harvest-600">{formatMoney(o.price)}/{o.priceUnit}</span>
                  </div>
                  <p className="text-xs text-gray-500">{o.quantity} {listing.unit} · {o.status}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {listing.matches.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Matching buyers</h2>
            <div className="space-y-2">
              {listing.matches.slice(0, 10).map((m) => (
                <div key={m.id} className="card">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{m.requirement.buyerProfile.businessName}</p>
                    <span className="text-xs font-bold text-brand-700">{Math.round(m.score)}% · {matchLabel(m.score)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Needs {m.requirement.quantity} {m.requirement.unit} by {formatDate(m.requirement.requiredDate)}{m.distanceKm != null ? ` · ${m.distanceKm} km away` : ""}</p>
                </div>
              ))}
            </div>
          </section>
        )}
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

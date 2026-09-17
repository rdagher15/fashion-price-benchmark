import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney } from "@/lib/format";
import { matchLabel } from "@/lib/matching";
import { distanceBandLabel } from "@/lib/constants";
import { anonymizedBuyerLabel } from "@/lib/anonymize";

export default async function FarmerListingDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = user!.farmerProfile!;

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      produceCategory: true,
      offers: { include: { buyerProfile: true, order: true }, orderBy: { createdAt: "desc" } },
      matches: { include: { requirement: { include: { buyerProfile: true } } }, orderBy: { score: "desc" } },
    },
  });
  if (!listing) notFound();
  if (listing.farmerProfileId !== profile.id) redirect("/farmer/listings");

  const methods: string[] = JSON.parse(listing.deliveryMethodsJson || "[]");

  const decoratedOffers = await Promise.all(
    listing.offers.map(async (o) => ({ ...o, buyerLabel: o.order ? o.buyerProfile.businessName : await anonymizedBuyerLabel(o.buyerProfile) }))
  );
  const decoratedMatches = await Promise.all(
    listing.matches.map(async (m) => ({ ...m, buyerLabel: await anonymizedBuyerLabel(m.requirement.buyerProfile) }))
  );

  const cluster = decoratedMatches.find((m) => m.clusterId);
  const clusterMembers = cluster ? decoratedMatches.filter((m) => m.clusterId === cluster.clusterId) : [];

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
              {decoratedOffers.map((o) => (
                <Link key={o.id} href={`/farmer/offers/${o.id}`} className="card block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{o.buyerLabel}</p>
                    <span className="text-xs font-bold text-mustard-600">{formatMoney(o.price)}/{o.priceUnit}</span>
                  </div>
                  <p className="text-xs text-gray-500">{o.quantity} {listing.unit} · {o.status}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {cluster && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Suggested fulfillment group</h2>
            <div className="card border-mustard-400 bg-mustard-50/40">
              <p className="text-sm font-semibold text-gray-800">
                {clusterMembers.length} nearby buyers could together take {cluster.quantityUtilizationScore}% of this listing
              </p>
              <p className="text-xs text-gray-500">Prioritizing this group over a single distant buyer maximizes how much of your stock sells this window.</p>
              <div className="mt-2 space-y-1">
                {clusterMembers.map((m) => (
                  <div key={m.id} className="flex justify-between text-xs text-gray-600">
                    <span>{m.buyerLabel}</span>
                    <span>{m.requirement.quantity} {m.requirement.unit}{m.distanceKm != null ? ` · ${m.distanceKm} km` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {decoratedMatches.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Matching buyers</h2>
            <div className="space-y-2">
              {decoratedMatches.slice(0, 10).map((m) => (
                <div key={m.id} className="card">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{m.buyerLabel}</p>
                    <span className="text-xs font-bold text-brand-700">{Math.round(m.score)}% · {matchLabel(m.score)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Needs {m.requirement.quantity} {m.requirement.unit} by {formatDate(m.requirement.requiredDate)}{m.distanceKm != null ? ` · ${m.distanceKm} km away (${distanceBandLabel(m.distanceKm)})` : ""}</p>
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

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney } from "@/lib/format";
import { matchLabel } from "@/lib/matching";

export default async function BuyerRequirementDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const requirement = await prisma.requirement.findUnique({
    where: { id: params.id },
    include: {
      produceCategory: true,
      matches: { include: { listing: { include: { produceCategory: true, farmerProfile: true } } }, orderBy: { score: "desc" } },
    },
  });
  if (!requirement) notFound();
  if (requirement.buyerProfileId !== profile.id) redirect("/buyer/requirements");

  return (
    <div>
      <TopBar title={requirement.produceCategory.name} backHref="/buyer/requirements" />
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <StatusPill status={requirement.status} />
          <span className="text-xs text-gray-400">Posted {formatDate(requirement.createdAt)}</span>
        </div>

        <div className="card space-y-1 text-sm">
          <Row label="Quantity" value={`${requirement.quantity} ${requirement.unit}`} />
          <Row label="Required by" value={formatDate(requirement.requiredDate)} />
          <Row label="Delivery to" value={requirement.deliveryLocationLabel} />
          {(requirement.minPrice || requirement.maxPrice) && (
            <Row label="Target price" value={`${requirement.minPrice ? formatMoney(requirement.minPrice) : "—"} – ${requirement.maxPrice ? formatMoney(requirement.maxPrice) : "—"} / ${requirement.priceUnit}`} />
          )}
          {requirement.recurring && <Row label="Recurring" value={requirement.recurringFrequency || "Yes"} />}
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold text-gray-800">Matching farmers ({requirement.matches.length})</h2>
          {requirement.matches.length === 0 && <p className="text-sm text-gray-400">No matches yet — check back soon.</p>}
          <div className="space-y-2">
            {requirement.matches.map((m) => (
              <div key={m.id} className="card">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{m.listing.farmerProfile.farmName}</p>
                  <span className="text-xs font-bold text-brand-700">{Math.round(m.score)}% · {matchLabel(m.score)}</span>
                </div>
                <p className="text-xs text-gray-500">{m.listing.quantity} {m.listing.unit} available · {formatMoney(m.listing.minPrice)}–{formatMoney(m.listing.maxPrice ?? m.listing.minPrice)}/{m.listing.priceUnit}</p>
                {m.distanceKm != null && <p className="text-xs text-gray-400">{m.distanceKm} km away</p>}
                <Link href={`/buyer/offers/new?listingId=${m.listingId}&requirementId=${requirement.id}`} className="btn-secondary mt-2 block text-center !py-2">Make an Offer</Link>
              </div>
            ))}
          </div>
        </section>
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

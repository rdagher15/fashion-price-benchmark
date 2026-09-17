import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney } from "@/lib/format";
import { matchLabel } from "@/lib/matching";
import { distanceBandLabel, REQUIREMENT_STATUS } from "@/lib/constants";
import AcceptMatchButton from "@/components/AcceptMatchButton";

export default async function BuyerRequestDetail({ params }: { params: { id: string } }) {
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
  if (requirement.buyerProfileId !== profile.id) redirect("/buyer/requests");

  if (requirement.status !== REQUIREMENT_STATUS.ACTIVE && requirement.status !== REQUIREMENT_STATUS.MATCHED) {
    const offer = await prisma.offer.findFirst({ where: { requirementId: requirement.id }, orderBy: { createdAt: "desc" } });
    return (
      <div>
        <TopBar title={requirement.produceCategory.name} backHref="/buyer/requests" />
        <div className="space-y-4 px-4 py-4">
          <StatusPill status={requirement.status} />
          <div className="card">
            <p className="text-sm font-semibold text-gray-800">This request has already been matched.</p>
            {offer && <Link href={`/buyer/offers/${offer.id}`} className="btn-secondary mt-3 block text-center">View order request</Link>}
          </div>
        </div>
      </div>
    );
  }

  const [top, ...alternatives] = requirement.matches;

  return (
    <div>
      <TopBar title={requirement.produceCategory.name} backHref="/buyer/requests" />
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <StatusPill status={requirement.status} />
          <span className="text-xs text-gray-400">Posted {formatDate(requirement.createdAt)}</span>
        </div>

        <div className="card space-y-1 text-sm">
          <Row label="Quantity" value={`${requirement.quantity} ${requirement.unit}`} />
          <Row label="Required date" value={formatDate(requirement.requiredDate)} />
          {requirement.dateMin && requirement.dateMax && (
            <Row label="Acceptable window" value={`${formatDate(requirement.dateMin)} – ${formatDate(requirement.dateMax)}`} />
          )}
          {requirement.maxPrice != null && <Row label="Max price" value={`${formatMoney(requirement.maxPrice)}/${requirement.priceUnit}`} />}
        </div>

        {!top && (
          <div className="card text-center text-sm text-gray-400">
            No matching farmers yet — we'll notify you as soon as one becomes available.
          </div>
        )}

        {top && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">We found a strong match</h2>
            <MatchCard match={top} requirementId={requirement.id} highlight />
          </section>
        )}

        {alternatives.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Other matches</h2>
            <div className="space-y-2">
              {alternatives.map((m) => <MatchCard key={m.id} match={m} requirementId={requirement.id} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, requirementId, highlight }: { match: any; requirementId: string; highlight?: boolean }) {
  const l = match.listing;
  return (
    <div className={`card ${highlight ? "border-mustard-400 bg-mustard-50/40" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-900">{l.produceCategory.name}{l.variety ? ` — ${l.variety}` : ""}</p>
        <span className="text-xs font-bold text-brand-700">{Math.round(match.score)}% Match</span>
      </div>
      <p className="text-sm text-gray-700">{l.quantity} {l.unit} available</p>
      <p className="text-sm font-semibold text-brand-700">{formatMoney(l.minPrice)}–{formatMoney(l.maxPrice ?? l.minPrice)}/{l.priceUnit}</p>
      <p className="text-xs text-gray-500">Available {formatDate(l.availableFrom)}–{formatDate(l.availableUntil)}</p>
      {match.distanceKm != null && <p className="text-xs text-gray-500">📍 {match.distanceKm} km away · {distanceBandLabel(match.distanceKm)}</p>}
      {match.clusterId && (
        <p className="mt-1 text-xs font-medium text-mustard-700">
          🤝 Part of a buyer group covering {match.quantityUtilizationScore}% of this farm's stock — stronger acceptance odds
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <AcceptMatchButton requirementId={requirementId} matchId={match.id} label={highlight ? "Accept Match" : "Accept This Instead"} />
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

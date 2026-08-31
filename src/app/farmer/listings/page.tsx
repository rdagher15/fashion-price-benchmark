import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney } from "@/lib/format";
import { LISTING_STATUS } from "@/lib/constants";

const ACTION_STATUSES: string[] = [LISTING_STATUS.OFFERS_RECEIVED, LISTING_STATUS.OFFER_ACCEPTED];

export default async function FarmerListingsPage() {
  const user = await getCurrentUser();
  const profile = user!.farmerProfile!;

  const listings = await prisma.listing.findMany({
    where: { farmerProfileId: profile.id },
    include: { produceCategory: true, offers: true, matches: true },
    orderBy: { createdAt: "desc" },
  });

  const sorted = [...listings].sort((a, b) => {
    const aAction = ACTION_STATUSES.includes(a.status) ? 0 : 1;
    const bAction = ACTION_STATUSES.includes(b.status) ? 0 : 1;
    return aAction - bAction;
  });

  return (
    <div>
      <TopBar title="My Listings" />
      <div className="space-y-3 px-4 py-4">
        <Link href="/farmer/listings/new" className="btn-primary block text-center">+ Add New Listing</Link>

        {sorted.length === 0 && <p className="pt-8 text-center text-sm text-gray-400">No listings yet. Add your first one above.</p>}

        {sorted.map((l) => (
          <Link key={l.id} href={`/farmer/listings/${l.id}`} className="card block">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{l.produceCategory.name}{l.variety ? ` — ${l.variety}` : ""}</p>
                <p className="text-xs text-gray-500">{l.quantity} {l.unit} · {formatDate(l.availableFrom)}–{formatDate(l.availableUntil)}</p>
                <p className="text-xs text-gray-500">{formatMoney(l.minPrice)}{l.maxPrice ? `–${formatMoney(l.maxPrice)}` : ""}/{l.priceUnit}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill status={l.status} />
                {l.offers.length > 0 && <span className="text-[11px] font-semibold text-harvest-600">{l.offers.length} offer(s)</span>}
                {l.matches.length > 0 && <span className="text-[11px] text-gray-400">{l.matches.length} match(es)</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

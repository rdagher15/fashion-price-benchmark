import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { formatDate, formatMoney } from "@/lib/format";
import { OFFER_STATUS } from "@/lib/constants";

export default async function BuyerOffersPage() {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const offers = await prisma.offer.findMany({
    where: { buyerProfileId: profile.id },
    include: { listing: { include: { produceCategory: true, farmerProfile: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pending = offers.filter((o) => [OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED].includes(o.status as any));
  const resolved = offers.filter((o) => !pending.includes(o));

  return (
    <div>
      <TopBar title="My Offers" />
      <div className="space-y-5 px-4 py-4">
        {offers.length === 0 && <p className="pt-8 text-center text-sm text-gray-400">No offers submitted yet.</p>}
        {pending.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Open</h2>
            <div className="space-y-2">{pending.map((o) => <OfferCard key={o.id} offer={o} />)}</div>
          </section>
        )}
        {resolved.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">History</h2>
            <div className="space-y-2">{resolved.map((o) => <OfferCard key={o.id} offer={o} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}

function OfferCard({ offer }: { offer: any }) {
  return (
    <Link href={`/buyer/offers/${offer.id}`} className="card block">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{offer.listing.farmerProfile.farmName}</p>
        <span className="text-xs font-bold text-mustard-600">{formatMoney(offer.price)}/{offer.priceUnit}</span>
      </div>
      <p className="text-xs text-gray-500">{offer.quantity} {offer.listing.unit} · {offer.listing.produceCategory.name} · {formatDate(offer.deliveryDate)}</p>
      <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{offer.status}</span>
    </Link>
  );
}

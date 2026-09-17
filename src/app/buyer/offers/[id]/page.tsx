import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { formatDate, formatMoney } from "@/lib/format";
import { OFFER_STATUS } from "@/lib/constants";
import OfferActions from "@/components/OfferActions";
import NegotiationHistory from "@/components/NegotiationHistory";

export default async function BuyerOfferDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    include: {
      listing: { include: { produceCategory: true, farmerProfile: true } },
      negotiations: { orderBy: { createdAt: "asc" } },
      order: true,
    },
  });
  if (!offer) notFound();
  if (offer.buyerProfileId !== profile.id) redirect("/buyer/offers");

  const listing = offer.listing;
  const isOpen = [OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED].includes(offer.status as any);
  const totalValue = offer.quantity * offer.price;

  return (
    <div>
      <TopBar title="Offer details" backHref="/buyer/offers" />
      <div className="space-y-4 px-4 py-4">
        <div className="card">
          <p className="text-xs font-semibold uppercase text-gray-400">Farmer</p>
          <p className="text-lg font-bold">{listing.farmerProfile.farmName}</p>
          <p className="text-sm text-gray-500">{listing.farmerProfile.city}, {listing.farmerProfile.region}</p>
        </div>

        <div className="card space-y-1 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Order</p>
          <Row label="Produce" value={`${listing.produceCategory.name}${listing.variety ? " — " + listing.variety : ""}`} />
          <Row label="Quantity" value={`${offer.quantity} ${listing.unit}`} />
          <Row label="Delivery date" value={formatDate(offer.deliveryDate)} />
          <Row label="Delivery method" value={offer.deliveryMethod.replace("_", " ")} />
        </div>

        <div className="card space-y-1 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Price</p>
          <Row label="Farmer's listed range" value={`${formatMoney(listing.minPrice)}${listing.maxPrice ? ` – ${formatMoney(listing.maxPrice)}` : ""}/${listing.priceUnit}`} />
          <Row label="Current offer" value={`${formatMoney(offer.price)}/${offer.priceUnit}`} />
          <Row label="Total order value" value={formatMoney(totalValue)} />
        </div>

        <NegotiationHistory negotiations={offer.negotiations} priceUnit={offer.priceUnit} />

        {offer.order && (
          <a href={`/buyer/orders/${offer.order.id}`} className="btn-secondary block text-center">View Order {offer.order.orderNumber}</a>
        )}

        {isOpen && !offer.order && <OfferActions offerId={offer.id} role="BUYER" currentPrice={offer.price} currentQuantity={offer.quantity} />}

        {!isOpen && !offer.order && <p className="text-center text-sm text-gray-400">This offer is {offer.status.toLowerCase()}.</p>}
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

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { formatDate, formatMoney } from "@/lib/format";
import { OFFER_STATUS, BUYER_TYPES } from "@/lib/constants";
import { anonymizedBuyerLabel } from "@/lib/anonymize";
import OfferActions from "@/components/OfferActions";
import NegotiationHistory from "@/components/NegotiationHistory";

export default async function FarmerOfferDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = user!.farmerProfile!;

  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    include: {
      listing: { include: { produceCategory: true } },
      buyerProfile: true,
      negotiations: { orderBy: { createdAt: "asc" } },
      order: true,
    },
  });
  if (!offer) notFound();
  if (offer.farmerProfileId !== profile.id) redirect("/farmer/offers");

  const listing = offer.listing;
  const inRange = offer.price >= listing.minPrice && offer.price <= (listing.maxPrice ?? listing.preferredPrice ?? Infinity);
  const isOpen = [OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED].includes(offer.status as any);
  const totalValue = offer.quantity * offer.price;

  // Retailer identity is disclosed only once an Order exists — before that
  // the farmer sees just the business type + general area.
  const revealed = !!offer.order;
  const buyerLabel = revealed ? offer.buyerProfile.businessName : await anonymizedBuyerLabel(offer.buyerProfile);
  const buyerTypeLabel = BUYER_TYPES.find((t) => t.value === offer.buyerProfile.buyerType)?.label ?? offer.buyerProfile.buyerType;

  return (
    <div>
      <TopBar title="Offer details" backHref="/farmer/offers" />
      <div className="space-y-4 px-4 py-4">
        <div className="card">
          <p className="text-xs font-semibold uppercase text-gray-400">{revealed ? "Buyer" : "Buyer (identity revealed once you accept)"}</p>
          <p className="text-lg font-bold">{buyerLabel}</p>
          {revealed && <p className="text-sm text-gray-500">{buyerTypeLabel} · {offer.buyerProfile.city}, {offer.buyerProfile.governorate}</p>}
        </div>

        <div className="card space-y-1 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Order</p>
          <Row label="Produce" value={`${listing.produceCategory.name}${listing.variety ? " — " + listing.variety : ""}`} />
          <Row label="Quantity" value={`${offer.quantity} ${listing.unit}`} />
          <Row label="Delivery date" value={formatDate(offer.deliveryDate)} />
          <Row label="Delivery method" value={offer.deliveryMethod.replace("_", " ")} />
          {offer.deliveryLocationLabel && <Row label="Delivery location" value={offer.deliveryLocationLabel} />}
          {offer.message && <Row label="Message" value={offer.message} />}
        </div>

        <div className="card space-y-1 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Price</p>
          <Row label="Your listed range" value={`${formatMoney(listing.minPrice)}${listing.maxPrice ? ` – ${formatMoney(listing.maxPrice)}` : ""}/${listing.priceUnit}`} />
          <Row label="Current offer" value={`${formatMoney(offer.price)}/${offer.priceUnit}`} />
          <Row label="Total order value" value={formatMoney(totalValue)} />
        </div>

        {isOpen && inRange && (
          <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            ✅ Offer is within your preferred price range
          </div>
        )}

        <NegotiationHistory negotiations={offer.negotiations} priceUnit={offer.priceUnit} />

        {offer.order && (
          <a href={`/farmer/orders/${offer.order.id}`} className="btn-secondary block text-center">View Order {offer.order.orderNumber}</a>
        )}

        {isOpen && !offer.order && <OfferActions offerId={offer.id} role="FARMER" currentPrice={offer.price} currentQuantity={offer.quantity} />}

        {!isOpen && !offer.order && (
          <p className="text-center text-sm text-gray-400">This offer is {offer.status.toLowerCase()}.</p>
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

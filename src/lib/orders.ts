import { prisma } from "./db";
import { generateOrderNumber } from "./format";
import { notify } from "./notify";
import { DEFAULT_ORDER_CHECKLIST, LISTING_STATUS, ORDER_STATUS, OFFER_STATUS, REQUIREMENT_STATUS } from "./constants";

// Converts an accepted offer into a shared Order, locking quantity/price/date,
// generating the prep checklist, and notifying both parties.
export async function createOrderFromOffer(offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: { include: { produceCategory: true } }, buyerProfile: { include: { user: true } }, farmerProfile: { include: { user: true } } },
  });
  if (!offer) throw new Error("Offer not found");

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      offerId: offer.id,
      listingId: offer.listingId,
      requirementId: offer.requirementId,
      buyerProfileId: offer.buyerProfileId,
      farmerProfileId: offer.farmerProfileId,
      produceLabel: `${offer.listing.produceCategory.name}${offer.listing.variety ? " — " + offer.listing.variety : ""}`,
      quantity: offer.quantity,
      unit: offer.listing.unit,
      agreedPrice: offer.price,
      priceUnit: offer.priceUnit,
      totalValue: offer.quantity * offer.price,
      deliveryDate: offer.deliveryDate,
      deliveryMethod: offer.deliveryMethod,
      deliveryLocationLabel: offer.deliveryLocationLabel,
      deliveryLatitude: offer.deliveryLatitude,
      deliveryLongitude: offer.deliveryLongitude,
      deliveryPersonType: offer.deliveryMethod === "farmer_delivery" ? "farmer" : offer.deliveryMethod === "buyer_pickup" ? "buyer_pickup" : "third_party",
      status: ORDER_STATUS.ACCEPTED,
      checklist: {
        create: DEFAULT_ORDER_CHECKLIST.map((task, i) => ({ task, sortOrder: i })),
      },
    },
  });

  await prisma.offer.update({ where: { id: offer.id }, data: { status: OFFER_STATUS.ACCEPTED } });
  await prisma.listing.update({ where: { id: offer.listingId }, data: { status: LISTING_STATUS.OFFER_ACCEPTED } });
  if (offer.requirementId) {
    await prisma.requirement.update({ where: { id: offer.requirementId }, data: { status: REQUIREMENT_STATUS.FULFILLED } }).catch(() => {});
  }

  // Any other pending offers on this listing lose their claim on the (now committed) quantity.
  await prisma.offer.updateMany({
    where: { listingId: offer.listingId, id: { not: offer.id }, status: { in: [OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED] } },
    data: { status: OFFER_STATUS.EXPIRED },
  });

  await notify(offer.farmerProfile.userId, "ORDER_CREATED", "Order confirmed", `Order ${order.orderNumber} confirmed with ${offer.buyerProfile.businessName}.`, `/farmer/orders/${order.id}`);
  await notify(offer.buyerProfile.userId, "ORDER_CREATED", "Offer accepted", `Your offer was accepted. Order ${order.orderNumber} is being prepared.`, `/buyer/orders/${order.id}`);

  return order;
}

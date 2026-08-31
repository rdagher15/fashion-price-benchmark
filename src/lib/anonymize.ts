import { prisma } from "./db";
import { retailerAnonymousLabel } from "./constants";

// Farmers only ever see the retailer's business type + governorate until an
// Order exists (see product spec: requests are anonymous to protect
// retailer privacy during matching/negotiation).
export async function anonymizedBuyerLabel(buyerProfile: { buyerType: string; governorate: string }) {
  const type = await prisma.businessType.findUnique({ where: { value: buyerProfile.buyerType } });
  return retailerAnonymousLabel(type?.label ?? buyerProfile.buyerType, buyerProfile.governorate);
}

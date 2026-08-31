import { prisma } from "./db";
import { haversineKm } from "./geo";
import { clusterMatchesForListing } from "./clustering";
import type { Listing, Requirement } from "@prisma/client";

export type MatchScoreBreakdown = {
  total: number;
  produceScore: number;
  quantityScore: number;
  dateScore: number;
  geoScore: number;
  deliveryScore: number;
  priceScore: number;
  distanceKm: number | null;
};

function daysBetween(a: Date, b: Date) {
  return Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export async function getMatchingConfig() {
  let config = await prisma.matchingConfig.findUnique({ where: { id: "singleton" } });
  if (!config) {
    // Concurrent first-load requests can race to create the singleton row;
    // fall back to re-reading rather than surfacing the unique-constraint error.
    config = await prisma.matchingConfig.create({ data: { id: "singleton" } }).catch(() =>
      prisma.matchingConfig.findUniqueOrThrow({ where: { id: "singleton" } })
    );
  }
  return config;
}

export function scoreListingAgainstRequirement(
  listing: Listing,
  requirement: Requirement,
  weights: { weightProduce: number; weightQuantity: number; weightDate: number; weightGeo: number; weightDelivery: number; weightPrice: number; maxDistanceKm: number }
): MatchScoreBreakdown {
  // 1. Produce match (exact category required to even be considered a candidate upstream)
  const produceScore = listing.produceCategoryId === requirement.produceCategoryId ? 100 : 0;

  // 2. Quantity match — how well listing supply covers the requirement's need.
  const reqQty = requirement.quantity;
  let quantityScore: number;
  if (listing.quantity >= reqQty) {
    const surplusRatio = reqQty / listing.quantity; // closer to 1 = tighter fit = better
    quantityScore = clamp(60 + surplusRatio * 40);
  } else {
    const coverageRatio = listing.quantity / reqQty;
    quantityScore = clamp(coverageRatio * 60);
  }
  if (listing.minOrderQuantity && requirement.quantity < listing.minOrderQuantity) {
    quantityScore = clamp(quantityScore - 40);
  }

  // 3. Date match — does listing availability window cover the required delivery date?
  const required = requirement.requiredDate;
  let dateScore: number;
  if (required >= listing.availableFrom && required <= listing.availableUntil) {
    dateScore = 100;
  } else {
    const gap = required < listing.availableFrom
      ? daysBetween(required, listing.availableFrom)
      : daysBetween(required, listing.availableUntil);
    dateScore = clamp(100 - gap * 12);
  }

  // 4. Geographic proximity
  const distanceKm = haversineKm(
    (listing as any).__lat ?? null,
    (listing as any).__lng ?? null,
    requirement.deliveryLatitude,
    requirement.deliveryLongitude
  );
  let geoScore: number;
  if (distanceKm == null) {
    geoScore = 50; // unknown location — neutral score
  } else {
    geoScore = clamp(100 - (distanceKm / weights.maxDistanceKm) * 100);
  }

  // 5. Delivery capability
  const methods: string[] = JSON.parse(listing.deliveryMethodsJson || "[]");
  let deliveryScore = 0;
  if (methods.includes("farmer_delivery") || methods.includes("third_party")) deliveryScore = 100;
  else if (methods.includes("buyer_pickup")) deliveryScore = 55;
  else deliveryScore = 20;

  // 6. Price compatibility
  const listingLow = listing.minPrice;
  const listingHigh = listing.maxPrice ?? listing.preferredPrice ?? listing.minPrice;
  let priceScore = 70; // neutral if buyer stated no target
  if (requirement.minPrice != null || requirement.maxPrice != null) {
    const reqLow = requirement.minPrice ?? 0;
    const reqHigh = requirement.maxPrice ?? Number.MAX_SAFE_INTEGER;
    const overlap = Math.min(listingHigh, reqHigh) - Math.max(listingLow, reqLow);
    if (overlap >= 0) {
      priceScore = 100;
    } else {
      const gap = Math.abs(overlap);
      const base = Math.max(listingLow, reqLow) || 1;
      priceScore = clamp(100 - (gap / base) * 200);
    }
  }

  const total =
    (produceScore * weights.weightProduce +
      quantityScore * weights.weightQuantity +
      dateScore * weights.weightDate +
      geoScore * weights.weightGeo +
      deliveryScore * weights.weightDelivery +
      priceScore * weights.weightPrice) /
    (weights.weightProduce + weights.weightQuantity + weights.weightDate + weights.weightGeo + weights.weightDelivery + weights.weightPrice);

  return {
    total: Math.round(clamp(total)),
    produceScore: Math.round(produceScore),
    quantityScore: Math.round(quantityScore),
    dateScore: Math.round(dateScore),
    geoScore: Math.round(geoScore),
    deliveryScore: Math.round(deliveryScore),
    priceScore: Math.round(priceScore),
    distanceKm,
  };
}

// Real score computation needs the farmer's lat/lng, which lives on
// FarmerProfile, not Listing — this wraps the pure scorer with that lookup.
async function scoreWithFarmerLocation(listing: Listing, requirement: Requirement, weights: any) {
  const farmer = await prisma.farmerProfile.findUnique({ where: { id: listing.farmerProfileId } });
  const decorated = Object.assign({}, listing, { __lat: farmer?.latitude, __lng: farmer?.longitude });
  return scoreListingAgainstRequirement(decorated as any, requirement, weights);
}

export async function generateMatchesForListing(listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return [];
  const config = await getMatchingConfig();
  const candidates = await prisma.requirement.findMany({
    where: { produceCategoryId: listing.produceCategoryId, status: { in: ["Active", "Matched"] } },
  });
  const results = [];
  for (const req of candidates) {
    const score = await scoreWithFarmerLocation(listing, req, config);
    const match = await prisma.match.upsert({
      where: { listingId_requirementId: { listingId: listing.id, requirementId: req.id } },
      update: {
        score: score.total,
        produceScore: score.produceScore,
        quantityScore: score.quantityScore,
        dateScore: score.dateScore,
        geoScore: score.geoScore,
        deliveryScore: score.deliveryScore,
        priceScore: score.priceScore,
        distanceKm: score.distanceKm ?? undefined,
      },
      create: {
        listingId: listing.id,
        requirementId: req.id,
        score: score.total,
        produceScore: score.produceScore,
        quantityScore: score.quantityScore,
        dateScore: score.dateScore,
        geoScore: score.geoScore,
        deliveryScore: score.deliveryScore,
        priceScore: score.priceScore,
        distanceKm: score.distanceKm ?? undefined,
      },
    });
    results.push(match);
  }
  await clusterMatchesForListing(listing.id);
  return results;
}

export async function generateMatchesForRequirement(requirementId: string) {
  const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });
  if (!requirement) return [];
  const config = await getMatchingConfig();
  const candidates = await prisma.listing.findMany({
    where: { produceCategoryId: requirement.produceCategoryId, status: { in: ["Published", "Offers Received"] } },
  });
  const results = [];
  for (const listing of candidates) {
    const score = await scoreWithFarmerLocation(listing, requirement, config);
    const match = await prisma.match.upsert({
      where: { listingId_requirementId: { listingId: listing.id, requirementId: requirement.id } },
      update: {
        score: score.total,
        produceScore: score.produceScore,
        quantityScore: score.quantityScore,
        dateScore: score.dateScore,
        geoScore: score.geoScore,
        deliveryScore: score.deliveryScore,
        priceScore: score.priceScore,
        distanceKm: score.distanceKm ?? undefined,
      },
      create: {
        listingId: listing.id,
        requirementId: requirement.id,
        score: score.total,
        produceScore: score.produceScore,
        quantityScore: score.quantityScore,
        dateScore: score.dateScore,
        geoScore: score.geoScore,
        deliveryScore: score.deliveryScore,
        priceScore: score.priceScore,
        distanceKm: score.distanceKm ?? undefined,
      },
    });
    results.push(match);
  }
  for (const listing of candidates) {
    await clusterMatchesForListing(listing.id);
  }
  return results;
}

export function matchLabel(score: number) {
  if (score >= 85) return "Strong Match";
  if (score >= 65) return "Good Match";
  if (score >= 45) return "Possible Match";
  return "Weak Match";
}

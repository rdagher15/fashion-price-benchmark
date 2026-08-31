import { prisma } from "./db";

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

// Modular "consolidated fulfillment" pass (product spec §11/§12): rather than
// only ranking each request against a listing individually, group nearby
// same-produce, overlapping-date requests that together can absorb a
// farmer's available quantity — prioritized over a single distant buyer
// taking a small slice of the same listing.
//
// MVP approach (explicitly not a VRP solver): sort eligible requests by
// distance, greedily accumulate the nearest ones until the listing's
// quantity is covered, and score the resulting group. Swappable later for a
// smarter optimizer without touching callers — this is the only place that
// writes Match.clusterId/clusterScore/quantityUtilizationScore.
export async function clusterMatchesForListing(listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return null;

  const matches = await prisma.match.findMany({
    where: { listingId, requirement: { status: { in: ["Active", "Matched", "Offer Sent"] } } },
    include: { requirement: true },
  });

  // Only requests whose acceptable delivery window overlaps the listing's availability.
  const eligible = matches.filter((m) => {
    const req = m.requirement;
    const reqStart = req.dateMin ?? req.requiredDate;
    const reqEnd = req.dateMax ?? req.requiredDate;
    return reqStart <= listing.availableUntil && reqEnd >= listing.availableFrom;
  });

  // Always clear stale cluster tags first — membership can shrink between runs.
  await prisma.match.updateMany({
    where: { listingId },
    data: { clusterId: null, clusterScore: null, quantityUtilizationScore: null },
  });

  if (eligible.length < 2) return null;

  const sorted = [...eligible].sort((a, b) => {
    const da = a.distanceKm ?? Infinity;
    const db = b.distanceKm ?? Infinity;
    if (da !== db) return da - db;
    return b.score - a.score;
  });

  const MAX_CLUSTER_RADIUS_KM = 100;
  const cluster: typeof sorted = [];
  let totalQuantity = 0;
  for (const m of sorted) {
    if (totalQuantity >= listing.quantity) break;
    if ((m.distanceKm ?? Infinity) > MAX_CLUSTER_RADIUS_KM) continue;
    cluster.push(m);
    totalQuantity += m.requirement.quantity;
  }

  if (cluster.length < 2) return null;

  const utilization = Math.min(totalQuantity, listing.quantity) / listing.quantity;
  const avgDistanceKm = cluster.reduce((sum, m) => sum + (m.distanceKm ?? MAX_CLUSTER_RADIUS_KM), 0) / cluster.length;
  const distanceScore = clamp(100 - (avgDistanceKm / MAX_CLUSTER_RADIUS_KM) * 100);

  const dates = cluster.map((m) => m.requirement.requiredDate.getTime());
  const spreadDays = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
  const timingScore = clamp(100 - spreadDays * 20); // same-day cluster scores highest

  const clusterScore = clamp(utilization * 100 * 0.5 + distanceScore * 0.3 + timingScore * 0.2);
  const clusterId = `${listingId}:cluster`;

  await Promise.all(
    cluster.map((m) =>
      prisma.match.update({
        where: { id: m.id },
        data: { clusterId, clusterScore, quantityUtilizationScore: Math.round(utilization * 100) },
      })
    )
  );

  return {
    clusterId,
    memberMatchIds: cluster.map((m) => m.id),
    memberCount: cluster.length,
    totalQuantity,
    listingQuantity: listing.quantity,
    utilization,
    clusterScore,
  };
}

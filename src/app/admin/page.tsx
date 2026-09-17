import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";

export default async function AdminOverview() {
  const [farmerCount, buyerCount, activeListings, activeRequirements, matchCount, offerCount, orders] = await Promise.all([
    prisma.user.count({ where: { role: "FARMER" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.listing.count({ where: { status: { notIn: ["Cancelled", "Completed"] } } }),
    prisma.requirement.count({ where: { status: "Active" } }),
    prisma.match.count(),
    prisma.offer.count(),
    prisma.order.findMany(),
  ]);

  const completed = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED);
  const gmv = completed.reduce((sum, o) => sum + o.totalValue, 0);
  const avgOrderValue = completed.length ? gmv / completed.length : 0;
  const fulfillmentRate = orders.length ? Math.round((completed.length / orders.length) * 100) : 0;

  const cards = [
    { label: "Registered farmers", value: farmerCount },
    { label: "Registered buyers", value: buyerCount },
    { label: "Active listings", value: activeListings },
    { label: "Active requirements", value: activeRequirements },
    { label: "Matches generated", value: matchCount },
    { label: "Offers submitted", value: offerCount },
    { label: "Orders completed", value: completed.length },
    { label: "Fulfillment rate", value: `${fulfillmentRate}%` },
    { label: "GMV", value: formatMoney(gmv) },
    { label: "Avg. order value", value: formatMoney(avgOrderValue) },
  ];

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Marketplace overview</h1>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

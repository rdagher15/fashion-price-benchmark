import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { formatDate, formatMoney, deliveryTimingLabel } from "@/lib/format";
import { ORDER_STATUS, REQUIREMENT_STATUS } from "@/lib/constants";
import { matchLabel } from "@/lib/matching";

export default async function BuyerHome() {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const [unreadCount, requirements, orders, topMatches] = await Promise.all([
    prisma.notification.count({ where: { userId: user!.id, read: false } }),
    prisma.requirement.findMany({ where: { buyerProfileId: profile.id }, include: { matches: true } }),
    prisma.order.findMany({ where: { buyerProfileId: profile.id }, include: { farmerProfile: true }, orderBy: { deliveryDate: "asc" } }),
    prisma.match.findMany({
      where: { requirement: { buyerProfileId: profile.id, status: REQUIREMENT_STATUS.ACTIVE } },
      include: { listing: { include: { produceCategory: true, farmerProfile: true } }, requirement: true },
      orderBy: { score: "desc" },
      take: 3,
    }),
  ]);

  const activeRequirements = requirements.filter((r) => r.status === REQUIREMENT_STATUS.ACTIVE).length;
  const matchingFarmers = requirements.reduce((sum, r) => sum + r.matches.length, 0);
  const activeOrders = orders.filter((o) => ![ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(o.status as any));
  const deliveriesToday = orders.filter((o) => new Date(o.deliveryDate).toDateString() === new Date().toDateString()).length;
  const completedOrders = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length;
  const deliveredAwaitingConfirm = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED);

  return (
    <div>
      <TopBar title={`Hi, ${user!.firstName} 👋`} subtitle={profile.businessName} unreadCount={unreadCount} />

      <div className="space-y-5 px-4 py-4">
        <Link href="/buyer/requests/new" className="btn-primary block text-center">+ Place New Request</Link>

        {deliveredAwaitingConfirm.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <span className="h-2 w-2 rounded-full bg-mustard-500" /> Confirm receipt
            </h2>
            <div className="space-y-2">
              {deliveredAwaitingConfirm.map((o) => (
                <Link key={o.id} href={`/buyer/orders/${o.id}`} className="card block">
                  <p className="text-sm font-semibold">{o.produceLabel}</p>
                  <p className="text-xs text-gray-500">{o.farmerProfile.farmName} · {o.quantity} {o.unit} delivered</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {topMatches.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Top matches for you</h2>
            <div className="space-y-2">
              {topMatches.map((m) => (
                <Link key={m.id} href={`/buyer/requests/${m.requirementId}`} className="card block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{m.listing.produceCategory.name}</p>
                    <span className="text-xs font-bold text-brand-700">{Math.round(m.score)}% · {matchLabel(m.score)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{m.listing.quantity} {m.listing.unit} available · {m.distanceKm != null ? `${m.distanceKm} km away` : ""}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold text-gray-800">Summary</h2>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Active requests" value={activeRequirements} href="/buyer/requests" />
            <SummaryCard label="Matching farmers" value={matchingFarmers} href="/buyer/search" />
            <SummaryCard label="Orders in progress" value={activeOrders.length} href="/buyer/orders" />
            <SummaryCard label="Deliveries today" value={deliveriesToday} href="/buyer/orders" />
            <SummaryCard label="Completed" value={completedOrders} href="/buyer/orders" />
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Link>
  );
}

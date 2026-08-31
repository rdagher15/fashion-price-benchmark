import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { formatDate, formatMoney, deliveryTimingLabel } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";

export default async function FarmerHome() {
  const user = await getCurrentUser();
  const profile = user!.farmerProfile!;

  const [unreadCount, listings, offers, orders] = await Promise.all([
    prisma.notification.count({ where: { userId: user!.id, read: false } }),
    prisma.listing.findMany({ where: { farmerProfileId: profile.id }, include: { produceCategory: true } }),
    prisma.offer.findMany({
      where: { farmerProfileId: profile.id, status: "PENDING" },
      include: { listing: { include: { produceCategory: true } }, buyerProfile: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { farmerProfileId: profile.id },
      include: { buyerProfile: true },
      orderBy: { deliveryDate: "asc" },
    }),
  ]);

  const activeListings = listings.filter((l) => !["Completed", "Cancelled"].includes(l.status)).length;
  const offersReceived = offers.length;
  const ordersAccepted = orders.filter((o) => o.status === ORDER_STATUS.ACCEPTED).length;
  const needingPrep = orders.filter((o) => [ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING].includes(o.status as any)).length;
  const awaitingDelivery = orders.filter((o) => [ORDER_STATUS.READY, ORDER_STATUS.OUT_FOR_DELIVERY].includes(o.status as any)).length;
  const completedOrders = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length;

  const activeOrders = orders.filter((o) => ![ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(o.status as any));

  return (
    <div>
      <TopBar title={`Hi, ${user!.firstName} 👋`} subtitle={profile.farmName} unreadCount={unreadCount} />

      <div className="space-y-5 px-4 py-4">
        <div className="card">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Profile completion</span>
            <span className="text-xs font-bold text-brand-700">{profile.profileCompletionPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${profile.profileCompletionPct}%` }} />
          </div>
          {profile.profileCompletionPct < 100 && (
            <Link href="/farmer/profile" className="mt-2 inline-block text-xs font-semibold text-brand-700">Complete your profile →</Link>
          )}
        </div>

        <Link href="/farmer/listings/new" className="btn-primary block text-center">+ Add New Listing</Link>

        {offers.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-800">
              <span className="h-2 w-2 rounded-full bg-harvest-500" /> Action required — New offers
            </h2>
            <div className="space-y-2">
              {offers.slice(0, 3).map((offer) => (
                <Link key={offer.id} href={`/farmer/offers/${offer.id}`} className="card block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{offer.buyerProfile.businessName}</p>
                    <span className="text-xs font-bold text-harvest-600">{formatMoney(offer.price)}/{offer.priceUnit}</span>
                  </div>
                  <p className="text-xs text-gray-500">{offer.quantity} {offer.listing.unit} · {offer.listing.produceCategory.name} · Delivery {formatDate(offer.deliveryDate)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {activeOrders.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Active orders</h2>
            <div className="space-y-2">
              {activeOrders.slice(0, 3).map((order) => (
                <Link key={order.id} href={`/farmer/orders/${order.id}`} className="card block">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{order.produceLabel}</p>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">{order.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{order.buyerProfile.businessName} · {deliveryTimingLabel(order.deliveryDate)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold text-gray-800">Summary</h2>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Active listings" value={activeListings} href="/farmer/listings" />
            <SummaryCard label="Offers received" value={offersReceived} href="/farmer/offers" />
            <SummaryCard label="Orders accepted" value={ordersAccepted} href="/farmer/orders" />
            <SummaryCard label="Need preparation" value={needingPrep} href="/farmer/orders" />
            <SummaryCard label="Awaiting delivery" value={awaitingDelivery} href="/farmer/orders" />
            <SummaryCard label="Completed" value={completedOrders} href="/farmer/orders" />
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

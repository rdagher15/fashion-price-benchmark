import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { BucketPill } from "@/components/StatusPill";
import { deliveryTimingLabel, formatMoney } from "@/lib/format";
import { orderUxBucket, ORDER_STATUS } from "@/lib/constants";

export default async function FarmerOrdersPage() {
  const user = await getCurrentUser();
  const profile = user!.farmerProfile!;

  const orders = await prisma.order.findMany({
    where: { farmerProfileId: profile.id },
    include: { buyerProfile: true },
    orderBy: { deliveryDate: "asc" },
  });

  const active = orders.filter((o) => ![ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(o.status as any));
  const done = orders.filter((o) => [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(o.status as any));

  return (
    <div>
      <TopBar title="Orders" />
      <div className="space-y-5 px-4 py-4">
        {orders.length === 0 && <p className="pt-8 text-center text-sm text-gray-400">No orders yet.</p>}
        {active.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Active</h2>
            <div className="space-y-2">{active.map((o) => <OrderCard key={o.id} order={o} href={`/farmer/orders/${o.id}`} role="FARMER" />)}</div>
          </section>
        )}
        {done.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-gray-800">Completed</h2>
            <div className="space-y-2">{done.map((o) => <OrderCard key={o.id} order={o} href={`/farmer/orders/${o.id}`} role="FARMER" />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, href, role }: { order: any; href: string; role: "FARMER" | "BUYER" }) {
  const bucket = orderUxBucket(order.status, role);
  const other = role === "FARMER" ? order.buyerProfile.businessName : order.farmerProfile?.farmName;
  return (
    <Link href={href} className="card block">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{order.produceLabel}</p>
        <BucketPill bucket={bucket} />
      </div>
      <p className="text-xs text-gray-500">{other} · {order.quantity} {order.unit} · {formatMoney(order.totalValue)}</p>
      <p className="text-xs font-medium text-mustard-600">{deliveryTimingLabel(order.deliveryDate)} · {order.status}</p>
    </Link>
  );
}

import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { buyerProfile: true, farmerProfile: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-gray-900">Orders ({orders.length})</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{o.orderNumber} · {o.produceLabel}</p>
                <p className="text-xs text-gray-500">{o.farmerProfile.farmName} → {o.buyerProfile.businessName} · {formatMoney(o.totalValue)} · {formatDate(o.deliveryDate)}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

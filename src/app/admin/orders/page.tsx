import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { ORDER_STATUS, RESOLUTION_TYPES } from "@/lib/constants";
import DisputeResolutionForm from "@/components/DisputeResolutionForm";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { buyerProfile: true, farmerProfile: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const disputes = orders.filter((o) => o.status === ORDER_STATUS.DISPUTED);

  return (
    <div>
      {disputes.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-red-600">Disputes needing review ({disputes.length})</h2>
          <div className="space-y-2">
            {disputes.map((o) => (
              <div key={o.id} className="card border-red-200 bg-red-50/40">
                <p className="font-semibold">{o.orderNumber} · {o.produceLabel}</p>
                <p className="text-xs text-gray-500">{o.farmerProfile.farmName} → {o.buyerProfile.businessName} · {formatMoney(o.totalValue)}</p>
                {o.farmerResponseNote && <p className="mt-1 text-xs text-gray-600">Farmer: "{o.farmerResponseNote}"</p>}
                <DisputeResolutionForm orderId={o.id} orderTotal={o.totalValue} />
              </div>
            ))}
          </div>
        </div>
      )}

      <h1 className="mb-4 text-lg font-bold text-gray-900">Orders ({orders.length})</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{o.orderNumber} · {o.produceLabel}</p>
                <p className="text-xs text-gray-500">{o.farmerProfile.farmName} → {o.buyerProfile.businessName} · {formatMoney(o.totalValue)} · {formatDate(o.deliveryDate)}</p>
                {o.resolutionType && (
                  <p className="mt-0.5 text-xs text-brand-700">
                    Resolved: {RESOLUTION_TYPES.find((r) => r.value === o.resolutionType)?.label || o.resolutionType}
                    {o.resolutionAmount ? ` · ${formatMoney(o.resolutionAmount)}` : ""} ({o.resolvedBy === "ADMIN" ? "support" : "farmer"})
                  </p>
                )}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.status === ORDER_STATUS.DISPUTED ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-600"}`}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

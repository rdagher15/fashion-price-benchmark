import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney, deliveryTimingLabel } from "@/lib/format";
import FarmerOrderActions from "@/components/FarmerOrderActions";
import ReviewForm from "@/components/ReviewForm";
import { DISCREPANCY_TYPES, ORDER_STATUS } from "@/lib/constants";

export default async function FarmerOrderDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = user!.farmerProfile!;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { buyerProfile: { include: { user: true } }, checklist: { orderBy: { sortOrder: "asc" } }, reviews: true },
  });
  if (!order) notFound();
  if (order.farmerProfileId !== profile.id) redirect("/farmer/orders");

  return (
    <div>
      <TopBar title={`Order ${order.orderNumber}`} backHref="/farmer/orders" />
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <StatusPill status={order.status} />
          <span className="text-xs font-semibold text-mustard-600">{deliveryTimingLabel(order.deliveryDate)}</span>
        </div>

        <div className="card space-y-1 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Buyer</p>
          <p className="text-base font-bold">{order.buyerProfile.businessName}</p>
          <p className="text-gray-500">{order.buyerProfile.contactPerson} · {order.buyerProfile.user.phone}</p>
          {order.deliveryLocationLabel && <p className="text-gray-500">📍 {order.deliveryLocationLabel}</p>}
        </div>

        <div className="card space-y-1 text-sm">
          <Row label="Produce" value={order.produceLabel} />
          <Row label="Quantity" value={`${order.quantity} ${order.unit}`} />
          <Row label="Agreed price" value={`${formatMoney(order.agreedPrice)}/${order.priceUnit}`} />
          <Row label="Total value" value={formatMoney(order.totalValue)} />
          <Row label="Delivery date" value={formatDate(order.deliveryDate)} />
          <Row label="Delivery method" value={order.deliveryMethod.replace("_", " ")} />
        </div>

        <FarmerOrderActions
          orderId={order.id}
          status={order.status}
          checklist={order.checklist}
          deliveryLat={order.deliveryLatitude}
          deliveryLng={order.deliveryLongitude}
          deliveryLabel={order.deliveryLocationLabel}
        />

        {order.status === ORDER_STATUS.DISCREPANCY && (
          <div className="card space-y-1 text-sm border-red-200 bg-red-50/50">
            <p className="mb-1 text-xs font-semibold uppercase text-red-500">Buyer reported a discrepancy</p>
            <p className="font-medium text-gray-800">
              {(order.discrepancyTypesJson ? JSON.parse(order.discrepancyTypesJson) as string[] : []).map((t) => DISCREPANCY_TYPES.find((d) => d.value === t)?.label || t).join(", ")}
            </p>
            {order.discrepancyNote && <p className="text-gray-600">{order.discrepancyNote}</p>}
          </div>
        )}

        {order.status === "Completed" && order.receivedQuantity != null && (
          <div className="card space-y-1 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Receipt confirmation</p>
            <Row label="Received quantity" value={`${order.receivedQuantity} ${order.unit}`} />
            <Row label="Condition" value={order.receivedCondition || "—"} />
            {order.receivedNote && <Row label="Note" value={order.receivedNote} />}
          </div>
        )}

        {order.status === "Completed" && (
          <ReviewForm orderId={order.id} alreadyReviewed={order.reviews.some((r) => r.reviewerId === user!.id)} />
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-50 py-1 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

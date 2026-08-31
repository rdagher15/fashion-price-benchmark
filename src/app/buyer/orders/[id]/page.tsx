import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney, deliveryTimingLabel } from "@/lib/format";
import BuyerOrderActions from "@/components/BuyerOrderActions";
import ReviewForm from "@/components/ReviewForm";
import { ORDER_STATUS_FLOW, ORDER_STATUS } from "@/lib/constants";

export default async function BuyerOrderDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { farmerProfile: { include: { user: true } }, reviews: true },
  });
  if (!order) notFound();
  if (order.buyerProfileId !== profile.id) redirect("/buyer/orders");

  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <div>
      <TopBar title={`Order ${order.orderNumber}`} backHref="/buyer/orders" />
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <StatusPill status={order.status} />
          <span className="text-xs font-semibold text-harvest-600">{deliveryTimingLabel(order.deliveryDate)}</span>
        </div>

        <div className="flex justify-between">
          {ORDER_STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center">
              <div className={`h-2 w-2 rounded-full ${i <= currentIdx ? "bg-brand-600" : "bg-gray-200"}`} />
              {i < ORDER_STATUS_FLOW.length - 1 && <div className={`mt-1 h-0.5 w-full ${i < currentIdx ? "bg-brand-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="card space-y-1 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Farmer</p>
          <p className="text-base font-bold">{order.farmerProfile.farmName}</p>
          <p className="text-gray-500">{order.farmerProfile.city}, {order.farmerProfile.region} · {order.farmerProfile.user.phone}</p>
        </div>

        <div className="card space-y-1 text-sm">
          <Row label="Produce" value={order.produceLabel} />
          <Row label="Quantity" value={`${order.quantity} ${order.unit}`} />
          <Row label="Agreed price" value={`${formatMoney(order.agreedPrice)}/${order.priceUnit}`} />
          <Row label="Total value" value={formatMoney(order.totalValue)} />
          <Row label="Delivery date" value={formatDate(order.deliveryDate)} />
          <Row label="Delivery method" value={order.deliveryMethod.replace("_", " ")} />
        </div>

        <BuyerOrderActions orderId={order.id} status={order.status} expectedQuantity={order.quantity} />

        {order.status === ORDER_STATUS.COMPLETED && order.receivedQuantity != null && (
          <div className="card space-y-1 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Your confirmation</p>
            <Row label="Received quantity" value={`${order.receivedQuantity} ${order.unit}`} />
            <Row label="Condition" value={order.receivedCondition || "—"} />
          </div>
        )}

        {order.status === ORDER_STATUS.COMPLETED && (
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

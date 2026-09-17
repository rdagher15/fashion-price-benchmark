import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate, formatMoney, deliveryTimingLabel } from "@/lib/format";
import BuyerOrderActions from "@/components/BuyerOrderActions";
import ReviewForm from "@/components/ReviewForm";
import { DisputedNotice, ResolutionSummary } from "@/components/OrderResolution";
import { ORDER_STATUS_FLOW, ORDER_STATUS, DISCREPANCY_TYPES } from "@/lib/constants";

export default async function BuyerOrderDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { farmerProfile: { include: { user: true } }, reviews: true, listing: true, requirement: true },
  });
  if (!order) notFound();
  if (order.buyerProfileId !== profile.id) redirect("/buyer/orders");

  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
  const discrepancyTypes: string[] = order.discrepancyTypesJson ? JSON.parse(order.discrepancyTypesJson) : [];
  const discrepancyPhotos: string[] = order.discrepancyPhotosJson ? JSON.parse(order.discrepancyPhotosJson) : [];

  return (
    <div>
      <TopBar title={`Order ${order.orderNumber}`} backHref="/buyer/orders" />
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <StatusPill status={order.status} />
          <span className="text-xs font-semibold text-mustard-600">{deliveryTimingLabel(order.deliveryDate)}</span>
        </div>

        {currentIdx >= 0 && (
          <div className="flex justify-between">
            {ORDER_STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div className={`h-2 w-2 rounded-full ${i <= currentIdx ? "bg-brand-600" : "bg-gray-200"}`} />
                {i < ORDER_STATUS_FLOW.length - 1 && <div className={`mt-1 h-0.5 w-full ${i < currentIdx ? "bg-brand-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

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

        <BuyerOrderActions
          orderId={order.id}
          status={order.status}
          expectedQuantity={order.quantity}
          unit={order.unit}
          originalSpec={{
            grade: order.listing.grade,
            qualityLevel: order.listing.qualityLevel,
            productionMethod: order.listing.productionMethod,
            packagingType: order.listing.packagingType,
            qualityRequirement: order.requirement?.qualityRequirement ?? null,
          }}
        />

        {order.status === ORDER_STATUS.DISCREPANCY && (
          <div className="card space-y-1 text-sm border-red-200 bg-red-50/50">
            <p className="mb-1 text-xs font-semibold uppercase text-red-500">Discrepancy reported</p>
            <p className="font-medium text-gray-800">{discrepancyTypes.map((t) => DISCREPANCY_TYPES.find((d) => d.value === t)?.label || t).join(", ")}</p>
            {order.discrepancyNote && <p className="text-gray-600">{order.discrepancyNote}</p>}
            {discrepancyPhotos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {discrepancyPhotos.map((url) => <img key={url} src={url} className="h-16 w-full rounded object-cover" alt="" />)}
              </div>
            )}
            <p className="text-xs text-gray-400">Reported {order.discrepancyReportedAt ? formatDate(order.discrepancyReportedAt) : ""}</p>
            <p className="text-xs text-gray-400">Waiting for the farmer's response.</p>
          </div>
        )}

        {order.status === ORDER_STATUS.DISPUTED && <DisputedNotice farmerResponseNote={order.farmerResponseNote} />}

        {order.resolutionType && (
          <ResolutionSummary
            resolutionType={order.resolutionType}
            resolutionAmount={order.resolutionAmount}
            resolutionNote={order.resolutionNote}
            resolvedAt={order.resolvedAt}
            resolvedBy={order.resolvedBy}
          />
        )}

        {order.status === ORDER_STATUS.COMPLETED && order.receivedQuantity != null && (
          <div className="card space-y-1 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Your confirmation</p>
            <Row label="Received quantity" value={`${order.receivedQuantity} ${order.unit}`} />
            <Row label="Condition" value={order.receivedCondition || "—"} />
            {order.signatureName && <Row label="Signed by" value={`${order.signatureName} · ${order.signedAt ? new Date(order.signedAt).toLocaleString() : ""}`} />}
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

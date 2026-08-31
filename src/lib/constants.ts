// Central status vocab. SQLite/Prisma can't enforce enums at the DB layer for
// SQLite, so these are the single source of truth for valid status strings.

export const LISTING_STATUS = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  OFFERS_RECEIVED: "Offers Received",
  OFFER_ACCEPTED: "Offer Accepted",
  ORDER_PREPARATION: "Order Preparation",
  READY_FOR_DELIVERY: "Ready for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const REQUIREMENT_STATUS = {
  ACTIVE: "Active",
  MATCHED: "Matched",
  OFFER_SENT: "Offer Sent",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
} as const;

export const OFFER_STATUS = {
  PENDING: "PENDING",
  COUNTERED: "COUNTERED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

// Shared order lifecycle, synchronized across farmer & buyer views.
export const ORDER_STATUS = {
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const ORDER_STATUS_FLOW: string[] = [
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.COMPLETED,
];

export const BUYER_TYPES = [
  { value: "supermarket", label: "Supermarket" },
  { value: "grocery", label: "Grocery store" },
  { value: "independent_retailer", label: "Independent / small retailer" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "hospital", label: "Hospital" },
  { value: "school", label: "School" },
  { value: "catering", label: "Catering company" },
  { value: "other", label: "Other institutional buyer" },
];

export const PRODUCE_FAMILIES = [
  "Vegetables",
  "Fruits",
  "Herbs",
  "Leafy Greens",
  "Root Vegetables",
  "Other",
];

export const PACKAGING_TYPES = ["loose", "box", "crate", "bag", "carton", "other"];

export const DELIVERY_METHODS = [
  { value: "farmer_delivery", label: "Farmer delivery" },
  { value: "buyer_pickup", label: "Buyer pickup" },
  { value: "third_party", label: "Third-party delivery" },
  { value: "other", label: "Other" },
];

export const SUPPORT_TYPES = ["Government", "NGO", "Cooperative", "Private organization", "Other"];

export const DEFAULT_ORDER_CHECKLIST = [
  "Confirm quantity",
  "Prepare produce",
  "Check packaging",
  "Confirm order quantity",
  "Prepare vehicle / transportation",
  "Confirm delivery location",
  "Confirm delivery time",
];

// Coarse status → UX bucket, drives the "needs action" prioritization on dashboards.
export type UxBucket = "needs_action" | "in_progress" | "awaiting_other" | "completed" | "cancelled";

export function orderUxBucket(status: string, viewerRole: "FARMER" | "BUYER"): UxBucket {
  if (status === ORDER_STATUS.COMPLETED) return "completed";
  if (status === ORDER_STATUS.CANCELLED) return "cancelled";
  if (status === ORDER_STATUS.DELIVERED) {
    return viewerRole === "BUYER" ? "needs_action" : "awaiting_other";
  }
  if (viewerRole === "FARMER") {
    return status === ORDER_STATUS.ACCEPTED || status === ORDER_STATUS.PREPARING || status === ORDER_STATUS.READY || status === ORDER_STATUS.OUT_FOR_DELIVERY
      ? "needs_action"
      : "in_progress";
  }
  return "awaiting_other";
}

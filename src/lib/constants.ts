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

// "Requirement" is the internal/DB name; the retailer-facing product term is
// "Request" (see /buyer/requests) — kept as one model per the no-duplication
// instruction, just relabeled in the UI.
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
  DISCREPANCY: "Discrepancy Reported",
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

// Fallback/seed source for BusinessType — the live list served to the app is
// database-driven via /api/business-types so admins can add categories later.
export const BUYER_TYPES = [
  { value: "supermarket", label: "Supermarket" },
  { value: "grocery", label: "Grocery store" },
  { value: "small_retailer", label: "Small retailer / shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "hospital", label: "Hospital" },
  { value: "school", label: "School" },
  { value: "catering", label: "Catering company" },
  { value: "food_distributor", label: "Food distributor" },
  { value: "other", label: "Other" },
];

export const PRODUCE_FAMILIES = [
  "Vegetables",
  "Fruits",
  "Herbs",
  "Leafy Greens",
  "Root Vegetables",
  "Cereals",
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

export const DEMAND_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "2_3x_week", label: "2–3 times per week" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "seasonal", label: "Seasonal" },
];

export const DISCREPANCY_TYPES = [
  { value: "shortage", label: "Quantity shortage" },
  { value: "quality", label: "Quality issue" },
  { value: "wrong_produce", label: "Wrong produce" },
  { value: "damaged", label: "Damaged produce" },
  { value: "packaging", label: "Packaging issue" },
  { value: "late", label: "Late delivery" },
  { value: "other", label: "Other" },
];

export const OPERATOR_POSITIONS = [
  "Owner",
  "General Manager",
  "Procurement Manager",
  "Purchasing Officer",
  "Restaurant Manager",
  "Other",
];

// ---------- Lebanon geography ----------
// Real administrative divisions (8 governorates / mohafazat) so registration
// dropdowns and seed data are Lebanon-accurate rather than placeholder text.

export const LEBANON_GOVERNORATES: Record<string, string[]> = {
  "Beirut": ["Beirut"],
  "Mount Lebanon": ["Baabda", "Aley", "Chouf", "Kesrouan", "Jbeil", "Metn"],
  "North Lebanon": ["Tripoli", "Zgharta", "Koura", "Batroun", "Bsharri", "Miniyeh-Danniyeh"],
  "Akkar": ["Akkar"],
  "Bekaa": ["Zahle", "West Bekaa", "Rachaya"],
  "Baalbek-Hermel": ["Baalbek", "Hermel"],
  "South Lebanon": ["Sidon", "Tyre", "Jezzine"],
  "Nabatieh": ["Nabatieh", "Bint Jbeil", "Marjeyoun", "Hasbaya"],
};

// A handful of well-known towns for quick-select + coordinate autofill in the
// registration UI (retailer/farmer can still drop a precise pin over these).
export const LEBANON_CITIES: { name: string; governorate: string; caza: string; lat: number; lng: number }[] = [
  { name: "Beirut", governorate: "Beirut", caza: "Beirut", lat: 33.8938, lng: 35.5018 },
  { name: "Jal El Dib", governorate: "Mount Lebanon", caza: "Metn", lat: 33.9333, lng: 35.5833 },
  { name: "Antelias", governorate: "Mount Lebanon", caza: "Metn", lat: 33.9142, lng: 35.5828 },
  { name: "Zalka", governorate: "Mount Lebanon", caza: "Metn", lat: 33.9028, lng: 35.5581 },
  { name: "Jounieh", governorate: "Mount Lebanon", caza: "Kesrouan", lat: 33.9808, lng: 35.6178 },
  { name: "Baabda", governorate: "Mount Lebanon", caza: "Baabda", lat: 33.8367, lng: 35.5433 },
  { name: "Aley", governorate: "Mount Lebanon", caza: "Aley", lat: 33.8103, lng: 35.6019 },
  { name: "Byblos (Jbeil)", governorate: "Mount Lebanon", caza: "Jbeil", lat: 34.1232, lng: 35.6508 },
  { name: "Zahle", governorate: "Bekaa", caza: "Zahle", lat: 33.8463, lng: 35.9019 },
  { name: "Chtaura", governorate: "Bekaa", caza: "Zahle", lat: 33.8172, lng: 35.8497 },
  { name: "Baalbek", governorate: "Baalbek-Hermel", caza: "Baalbek", lat: 34.0059, lng: 36.2075 },
  { name: "Tripoli", governorate: "North Lebanon", caza: "Tripoli", lat: 34.4367, lng: 35.8497 },
  { name: "Halba", governorate: "Akkar", caza: "Akkar", lat: 34.5417, lng: 36.0819 },
  { name: "Sidon (Saida)", governorate: "South Lebanon", caza: "Sidon", lat: 33.5571, lng: 35.3729 },
  { name: "Tyre (Sour)", governorate: "South Lebanon", caza: "Tyre", lat: 33.2704, lng: 35.2038 },
  { name: "Jezzine", governorate: "South Lebanon", caza: "Jezzine", lat: 33.5453, lng: 35.5836 },
  { name: "Nabatieh", governorate: "Nabatieh", caza: "Nabatieh", lat: 33.3789, lng: 35.4839 },
];

// Starting parameters (not permanent business rules) for how the matching
// engine's geo score reads as a human label.
export const DISTANCE_BANDS = [
  { max: 5, label: "Excellent" },
  { max: 15, label: "Very good" },
  { max: 30, label: "Good" },
  { max: 50, label: "Acceptable" },
  { max: 100, label: "Weak" },
  { max: Infinity, label: "Very weak" },
];

export function distanceBandLabel(km: number | null | undefined): string {
  if (km == null) return "Unknown";
  return DISTANCE_BANDS.find((b) => km <= b.max)?.label ?? "Very weak";
}

// Retailer identity stays anonymous to farmers until the request becomes an
// Order (see product spec: "protect retailer privacy ... within the platform").
export function retailerAnonymousLabel(buyerTypeLabel: string, governorate: string): string {
  return `${buyerTypeLabel} — ${governorate}`;
}

// Coarse status → UX bucket, drives the "needs action" prioritization on dashboards.
export type UxBucket = "needs_action" | "in_progress" | "awaiting_other" | "completed" | "cancelled";

export function orderUxBucket(status: string, viewerRole: "FARMER" | "BUYER"): UxBucket {
  if (status === ORDER_STATUS.COMPLETED) return "completed";
  if (status === ORDER_STATUS.CANCELLED) return "cancelled";
  if (status === ORDER_STATUS.DISCREPANCY) return "needs_action";
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

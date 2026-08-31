export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Lebanon commonly quotes produce trade in USD.
export function formatMoney(amount: number, currency = "$") {
  return `${currency}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function daysUntil(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diff = Math.ceil((date.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  return diff;
}

export function deliveryTimingLabel(deliveryDate: Date | string) {
  const diff = daysUntil(deliveryDate);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Delivery required today";
  if (diff === 1) return "Order preparation required tomorrow";
  return `Delivery in ${diff} days`;
}

// e.g. "LEB-000123" — seq is typically (current order count + 1).
export function generateOrderNumber(seq: number) {
  return `LEB-${String(seq).padStart(6, "0")}`;
}

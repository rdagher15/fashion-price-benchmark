import { RESOLUTION_TYPES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";

export function DisputedNotice({ farmerResponseNote }: { farmerResponseNote: string | null }) {
  return (
    <div className="card space-y-1 text-sm border-mustard-300 bg-mustard-50/40">
      <p className="mb-1 text-xs font-semibold uppercase text-mustard-600">Disputed — under review</p>
      <p className="text-gray-600">The farmer disputed this discrepancy report. HarvestLink support is reviewing and will resolve it.</p>
      {farmerResponseNote && (
        <p className="mt-1 rounded-lg bg-white p-2 text-gray-700">
          <span className="font-medium text-gray-500">Farmer's response: </span>
          {farmerResponseNote}
        </p>
      )}
    </div>
  );
}

export function ResolutionSummary({
  resolutionType,
  resolutionAmount,
  resolutionNote,
  resolvedAt,
  resolvedBy,
}: {
  resolutionType: string;
  resolutionAmount: number | null;
  resolutionNote: string | null;
  resolvedAt: Date | string | null;
  resolvedBy: string | null;
}) {
  const label = RESOLUTION_TYPES.find((r) => r.value === resolutionType)?.label || resolutionType;
  return (
    <div className="card space-y-1 text-sm border-brand-200 bg-brand-50/40">
      <p className="mb-1 text-xs font-semibold uppercase text-brand-700">Dispute resolution</p>
      <p className="font-medium text-gray-800">
        {label}
        {resolutionAmount ? ` · ${formatMoney(resolutionAmount)}` : ""}
      </p>
      {resolutionNote && <p className="text-gray-600">{resolutionNote}</p>}
      <p className="text-xs text-gray-400">
        Resolved by {resolvedBy === "ADMIN" ? "HarvestLink support" : "farmer"} {resolvedAt ? `· ${formatDate(resolvedAt)}` : ""}
      </p>
    </div>
  );
}

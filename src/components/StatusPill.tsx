const BUCKET_STYLES: Record<string, string> = {
  needs_action: "bg-harvest-100 text-harvest-600",
  in_progress: "bg-blue-50 text-blue-600",
  awaiting_other: "bg-gray-100 text-gray-500",
  completed: "bg-brand-100 text-brand-700",
  cancelled: "bg-red-50 text-red-500",
};

const BUCKET_LABEL: Record<string, string> = {
  needs_action: "Needs Action",
  in_progress: "In Progress",
  awaiting_other: "Awaiting Other Party",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function BucketPill({ bucket }: { bucket: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${BUCKET_STYLES[bucket] || "bg-gray-100 text-gray-500"}`}>
      {BUCKET_LABEL[bucket] || bucket}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
      {status}
    </span>
  );
}

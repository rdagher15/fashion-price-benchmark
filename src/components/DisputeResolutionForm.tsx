"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BUYER_RESOLUTIONS = [
  { value: "REFUND_FULL", label: "Full refund" },
  { value: "REFUND_PARTIAL", label: "Partial refund" },
  { value: "REPLACEMENT", label: "Replacement / re-delivery" },
  { value: "CREDIT", label: "Store credit" },
];

export default function DisputeResolutionForm({ orderId, orderTotal }: { orderId: string; orderTotal: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "buyer" | "farmer">("choose");
  const [resolutionType, setResolutionType] = useState("REFUND_FULL");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(body: Record<string, unknown>) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/orders/${orderId}/resolve-dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(typeof data.error === "string" ? data.error : "Could not resolve dispute"); return; }
    router.refresh();
  }

  if (mode === "choose") {
    return (
      <div className="mt-2 flex gap-2">
        <button className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white" onClick={() => setMode("buyer")}>Side with buyer</button>
        <button className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700" onClick={() => setMode("farmer")}>Side with farmer</button>
      </div>
    );
  }

  if (mode === "buyer") {
    return (
      <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-2">
        <select className="input-field" value={resolutionType} onChange={(e) => setResolutionType(e.target.value)}>
          {BUYER_RESOLUTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {(resolutionType === "REFUND_PARTIAL" || resolutionType === "CREDIT") && (
          <input className="input-field" type="number" min={0} max={resolutionType === "REFUND_PARTIAL" ? orderTotal : undefined} step="0.01" placeholder={`Amount (order total $${orderTotal.toFixed(2)})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        )}
        <textarea className="input-field" rows={2} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700" onClick={() => setMode("choose")}>Back</button>
          <button
            className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white"
            disabled={loading}
            onClick={() => submit({ decision: "side_with_buyer", resolutionType, amount: amount ? Number(amount) : undefined, note })}
          >
            {loading ? "Resolving…" : "Confirm"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-2">
      <textarea className="input-field" rows={2} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700" onClick={() => setMode("choose")}>Back</button>
        <button
          className="rounded-full bg-gray-700 px-2.5 py-1 text-[11px] font-semibold text-white"
          disabled={loading}
          onClick={() => submit({ decision: "side_with_farmer", note })}
        >
          {loading ? "Resolving…" : "Confirm — dismiss claim"}
        </button>
      </div>
    </div>
  );
}

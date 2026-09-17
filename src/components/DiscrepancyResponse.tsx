"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPT_RESOLUTIONS = [
  { value: "REFUND_FULL", label: "Full refund" },
  { value: "REFUND_PARTIAL", label: "Partial refund" },
  { value: "REPLACEMENT", label: "Replacement / re-delivery" },
  { value: "CREDIT", label: "Store credit" },
];

export default function DiscrepancyResponse({ orderId, orderTotal }: { orderId: string; orderTotal: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "accept" | "dispute">("choose");
  const [resolutionType, setResolutionType] = useState("REFUND_FULL");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(body: Record<string, unknown>) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/discrepancy/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(typeof data.error === "string" ? data.error : "Could not submit response"); return; }
    router.refresh();
  }

  if (mode === "choose") {
    return (
      <div className="card space-y-2 border-red-200 bg-red-50/40">
        <p className="text-sm font-semibold text-gray-800">How would you like to respond?</p>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => setMode("accept")}>Accept &amp; Resolve</button>
          <button className="btn-secondary" onClick={() => setMode("dispute")}>Dispute This Claim</button>
        </div>
      </div>
    );
  }

  if (mode === "accept") {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-bold">Accept &amp; resolve</h3>
        <div>
          <label className="label">Resolution</label>
          <select className="input-field" value={resolutionType} onChange={(e) => setResolutionType(e.target.value)}>
            {ACCEPT_RESOLUTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        {resolutionType === "REFUND_PARTIAL" && (
          <div>
            <label className="label">Refund amount (order total ${orderTotal.toFixed(2)})</label>
            <input className="input-field" type="number" min={0} max={orderTotal} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
        )}
        {(resolutionType === "CREDIT") && (
          <div>
            <label className="label">Credit amount (optional)</label>
            <input className="input-field" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
        )}
        <textarea className="input-field" rows={2} placeholder="Note to buyer (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setMode("choose")}>Back</button>
          <button
            className="btn-primary"
            disabled={loading}
            onClick={() => submit({ action: "accept", resolutionType, amount: amount ? Number(amount) : undefined, note })}
          >
            {loading ? "Submitting…" : "Confirm Resolution"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-bold">Dispute this claim</h3>
      <p className="text-xs text-gray-500">Explain why you disagree. HarvestLink support will review and make a final decision.</p>
      <textarea className="input-field" rows={3} placeholder="Explain your side" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => setMode("choose")}>Back</button>
        <button className="btn-primary !bg-red-600" disabled={loading} onClick={() => submit({ action: "dispute", note })}>
          {loading ? "Submitting…" : "Submit Dispute"}
        </button>
      </div>
    </div>
  );
}

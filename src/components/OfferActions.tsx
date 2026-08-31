"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OfferActions({ offerId, role, currentPrice, currentQuantity }: { offerId: string; role: "FARMER" | "BUYER"; currentPrice: number; currentQuantity: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "negotiate" | "reject">("idle");
  const [price, setPrice] = useState(String(currentPrice));
  const [quantity, setQuantity] = useState(String(currentQuantity));
  const [rationale, setRationale] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/offers/${offerId}/accept`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Could not accept offer"); return; }
    router.push(role === "FARMER" ? `/farmer/orders/${data.order.id}` : `/buyer/orders/${data.order.id}`);
    router.refresh();
  }

  async function submitNegotiate() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/offers/${offerId}/negotiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: Number(price), quantity: Number(quantity), rationale }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Could not submit counter-offer"); return; }
    setMode("idle");
    router.refresh();
  }

  async function submitReject() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/offers/${offerId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setLoading(false);
    if (!res.ok) { setError("Could not reject offer"); return; }
    router.refresh();
  }

  if (mode === "negotiate") {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-bold">Counter-offer</h3>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Price</label><input className="input-field" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div><label className="label">Quantity</label><input className="input-field" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
        </div>
        <div>
          <label className="label">Reason (optional)</label>
          <textarea className="input-field" rows={3} placeholder="e.g. higher transportation cost, smaller quantity, market price changes…" value={rationale} onChange={(e) => setRationale(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setMode("idle")}>Cancel</button>
          <button className="btn-primary" disabled={loading} onClick={submitNegotiate}>{loading ? "Sending…" : "Submit counter-offer"}</button>
        </div>
      </div>
    );
  }

  if (mode === "reject") {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-bold">Reject offer</h3>
        <textarea className="input-field" rows={2} placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setMode("idle")}>Cancel</button>
          <button className="btn-primary !bg-red-600" disabled={loading} onClick={submitReject}>{loading ? "…" : "Confirm reject"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary" disabled={loading} onClick={accept}>✓ Accept offer</button>
      <button className="btn-secondary" onClick={() => setMode("negotiate")}>↔ Negotiate</button>
      <button className="w-full text-center text-sm font-semibold text-red-500" onClick={() => setMode("reject")}>✕ Reject</button>
    </div>
  );
}

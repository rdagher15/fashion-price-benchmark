"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS } from "@/lib/constants";

export default function BuyerOrderActions({ orderId, status, expectedQuantity }: { orderId: string; status: string; expectedQuantity: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [receivedQuantity, setReceivedQuantity] = useState(String(expectedQuantity));
  const [receivedCondition, setReceivedCondition] = useState("good");
  const [receivedNote, setReceivedNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receivedQuantity: Number(receivedQuantity), receivedCondition, receivedNote }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Could not confirm receipt"); return; }
    router.refresh();
  }

  if (status !== ORDER_STATUS.DELIVERED) return null;

  if (!confirming) {
    return (
      <div className="card space-y-2 border-harvest-200 bg-harvest-50/40">
        <p className="text-sm font-semibold text-gray-800">Delivery received — confirmation required</p>
        <button className="btn-primary" onClick={() => setConfirming(true)}>Confirm Receipt</button>
      </div>
    );
  }

  return (
    <div className="card space-y-2">
      <h3 className="text-sm font-bold">Confirm receipt</h3>
      <div><label className="label">Quantity received</label><input className="input-field" type="number" value={receivedQuantity} onChange={(e) => setReceivedQuantity(e.target.value)} /></div>
      <div>
        <label className="label">Condition</label>
        <select className="input-field" value={receivedCondition} onChange={(e) => setReceivedCondition(e.target.value)}>
          <option value="good">Good</option>
          <option value="damaged">Damaged</option>
          <option value="partial">Partial</option>
        </select>
      </div>
      <textarea className="input-field" rows={2} placeholder="Note (optional)" value={receivedNote} onChange={(e) => setReceivedNote(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
        <button className="btn-primary" disabled={loading} onClick={submit}>{loading ? "Confirming…" : "Confirm & complete order"}</button>
      </div>
    </div>
  );
}

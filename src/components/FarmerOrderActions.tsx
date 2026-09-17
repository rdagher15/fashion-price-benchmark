"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS, DEFAULT_ORDER_CHECKLIST } from "@/lib/constants";
import { mapsDirectionsUrl } from "@/lib/geo";

type ChecklistItem = { id: string; task: string; completed: boolean };

export default function FarmerOrderActions({
  orderId,
  status,
  checklist,
  deliveryLat,
  deliveryLng,
  deliveryLabel,
}: {
  orderId: string;
  status: string;
  checklist: ChecklistItem[];
  deliveryLat: number | null;
  deliveryLng: number | null;
  deliveryLabel: string | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState(checklist);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAltDelivery, setShowAltDelivery] = useState(false);
  const [deliveryPersonType, setDeliveryPersonType] = useState("farmer");
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryContact, setDeliveryContact] = useState("");

  async function toggleItem(item: ChecklistItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    await fetch(`/api/orders/${orderId}/checklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, completed: !item.completed }),
    });
  }

  async function advance(extra?: Record<string, unknown>) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(extra || {}),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Could not update order"); return; }
    router.refresh();
  }

  const mapsUrl = mapsDirectionsUrl(deliveryLat, deliveryLng, deliveryLabel || undefined);

  return (
    <div className="space-y-4">
      {(status === ORDER_STATUS.ACCEPTED || status === ORDER_STATUS.PREPARING) && (
        <section className="card space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Before delivery</h3>
          {items.length === 0 && <p className="text-xs text-gray-400">{DEFAULT_ORDER_CHECKLIST.join(", ")}</p>}
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={item.completed} onChange={() => toggleItem(item)} />
              <span className={item.completed ? "text-gray-400 line-through" : "text-gray-800"}>{item.task}</span>
            </label>
          ))}
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {status === ORDER_STATUS.ACCEPTED && (
        <button className="btn-primary" disabled={loading} onClick={() => advance()}>Start preparing order</button>
      )}

      {status === ORDER_STATUS.PREPARING && (
        <button className="btn-primary" disabled={loading} onClick={() => advance()}>Mark ready for delivery</button>
      )}

      {status === ORDER_STATUS.READY && !showAltDelivery && (
        <div className="space-y-2">
          <button className="btn-primary" disabled={loading} onClick={() => advance({ deliveryPersonType: "farmer" })}>I will deliver — Dispatch now</button>
          <button className="btn-secondary" onClick={() => setShowAltDelivery(true)}>Someone else will deliver this order</button>
        </div>
      )}

      {status === ORDER_STATUS.READY && showAltDelivery && (
        <div className="card space-y-2">
          <h3 className="text-sm font-bold">Alternative delivery</h3>
          <select className="input-field" value={deliveryPersonType} onChange={(e) => setDeliveryPersonType(e.target.value)}>
            <option value="other_farmer">Another farmer</option>
            <option value="driver">Driver</option>
            <option value="third_party">Third-party logistics provider</option>
            <option value="buyer_pickup">Buyer will pick up</option>
          </select>
          {deliveryPersonType !== "buyer_pickup" && (
            <>
              <input className="input-field" placeholder="Name" value={deliveryPersonName} onChange={(e) => setDeliveryPersonName(e.target.value)} />
              <input className="input-field" placeholder="Contact number" value={deliveryContact} onChange={(e) => setDeliveryContact(e.target.value)} />
            </>
          )}
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowAltDelivery(false)}>Back</button>
            <button className="btn-primary" disabled={loading} onClick={() => advance({ deliveryPersonType, deliveryPersonName, deliveryContact })}>Confirm & dispatch</button>
          </div>
        </div>
      )}

      {status === ORDER_STATUS.OUT_FOR_DELIVERY && (
        <div className="space-y-2">
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-secondary block text-center">🧭 Navigate to buyer</a>
          )}
          <button className="btn-primary" disabled={loading} onClick={() => advance()}>Mark as Delivered</button>
        </div>
      )}

      {status === ORDER_STATUS.DELIVERED && (
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">Delivered — waiting for the buyer to confirm receipt.</p>
      )}

      {status === ORDER_STATUS.COMPLETED && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-center text-sm font-semibold text-brand-700">✅ Delivery confirmed — order completed.</p>
      )}
    </div>
  );
}

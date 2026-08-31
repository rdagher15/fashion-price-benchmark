"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import { formatMoney } from "@/lib/format";
import { DELIVERY_METHODS } from "@/lib/constants";

export default function NewOfferPage() {
  const router = useRouter();
  const params = useSearchParams();
  const listingId = params.get("listingId") || "";
  const requirementId = params.get("requirementId") || undefined;

  const [listing, setListing] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    quantity: "", price: "", deliveryDate: "", deliveryMethod: "buyer_pickup",
    deliveryLocationLabel: "", packagingNote: "", message: "",
  });

  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/listings/${listingId}`).then((r) => r.json()).then((d) => {
      setListing(d.listing);
      if (d.listing) {
        setForm((f) => ({ ...f, price: String(d.listing.preferredPrice || d.listing.minPrice), quantity: String(Math.min(d.listing.quantity, d.listing.minOrderQuantity || d.listing.quantity)) }));
      }
    });
  }, [listingId]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const total = (Number(form.quantity) || 0) * (Number(form.price) || 0);
  const inRange = listing && Number(form.price) >= listing.minPrice && Number(form.price) <= (listing.maxPrice ?? listing.preferredPrice ?? Infinity);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.quantity || !form.price || !form.deliveryDate) { setError("Please fill in quantity, price and delivery date."); return; }
    setLoading(true);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId, requirementId,
        quantity: Number(form.quantity), price: Number(form.price),
        deliveryDate: form.deliveryDate, deliveryMethod: form.deliveryMethod,
        deliveryLocationLabel: form.deliveryLocationLabel, packagingNote: form.packagingNote, message: form.message,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Could not submit offer"); return; }
    router.push(`/buyer/offers/${data.offer.id}`);
  }

  if (!listing) return <div><TopBar title="Make an Offer" backHref="/buyer/search" /><p className="p-4 text-sm text-gray-400">Loading…</p></div>;

  return (
    <div>
      <TopBar title="Make an Offer" backHref="/buyer/search" />
      <div className="px-4 py-4">
        <div className="card mb-4">
          <p className="font-semibold">{listing.farmerProfile.farmName}</p>
          <p className="text-sm text-gray-500">{listing.produceCategory.name}{listing.variety ? ` — ${listing.variety}` : ""} · {listing.quantity} {listing.unit} available</p>
          <p className="text-sm font-semibold text-brand-700">{formatMoney(listing.minPrice)}{listing.maxPrice ? `–${formatMoney(listing.maxPrice)}` : ""}/{listing.priceUnit}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Quantity ({listing.unit})</label><input className="input-field" type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></div>
            <div><label className="label">Price / {listing.priceUnit}</label><input className="input-field" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
          </div>
          {inRange && <p className="text-xs font-semibold text-brand-700">✅ Within the farmer's preferred price range</p>}
          <div><label className="label">Delivery date</label><input className="input-field" type="date" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} /></div>
          <div>
            <label className="label">Delivery method</label>
            <select className="input-field" value={form.deliveryMethod} onChange={(e) => set("deliveryMethod", e.target.value)}>
              {DELIVERY_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div><label className="label">Delivery location</label><input className="input-field" value={form.deliveryLocationLabel} onChange={(e) => set("deliveryLocationLabel", e.target.value)} /></div>
          <div><label className="label">Packaging requirement (optional)</label><input className="input-field" value={form.packagingNote} onChange={(e) => set("packagingNote", e.target.value)} /></div>
          <div><label className="label">Message (optional)</label><textarea className="input-field" rows={2} value={form.message} onChange={(e) => set("message", e.target.value)} /></div>

          <div className="card">
            <div className="flex justify-between text-sm"><span>Total order value</span><span className="font-bold">{formatMoney(total)}</span></div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Submitting…" : "Submit Offer"}</button>
        </form>
      </div>
    </div>
  );
}

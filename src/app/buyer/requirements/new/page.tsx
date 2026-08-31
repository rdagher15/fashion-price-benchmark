"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

type Category = { id: string; family: string; name: string; variety: string | null; defaultUnit: string };

export default function NewRequirementPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    produceCategoryId: "", quantity: "", minQuantity: "", maxQuantity: "", unit: "kg",
    requiredDate: "", recurring: false, recurringFrequency: "weekly",
    deliveryLocationLabel: "", deliveryAddress: "", deliveryLatitude: "", deliveryLongitude: "",
    packagingRequirement: "", qualityRequirement: "", productionRequirement: "no_preference",
    minPrice: "", maxPrice: "", priceUnit: "kg",
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      set("deliveryLatitude", String(pos.coords.latitude));
      set("deliveryLongitude", String(pos.coords.longitude));
      setLocating(false);
    }, () => setLocating(false));
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.family] ||= []).push(c);
    return acc;
  }, {});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.produceCategoryId || !form.quantity || !form.requiredDate || !form.deliveryLocationLabel) {
      setError("Please fill in produce, quantity, required date and delivery location.");
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined,
      maxQuantity: form.maxQuantity ? Number(form.maxQuantity) : undefined,
      deliveryLatitude: form.deliveryLatitude ? Number(form.deliveryLatitude) : undefined,
      deliveryLongitude: form.deliveryLongitude ? Number(form.deliveryLongitude) : undefined,
      minPrice: form.minPrice ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
    };
    const res = await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError("Please check the form and try again."); return; }
    router.push(`/buyer/requirements/${data.requirement.id}`);
  }

  return (
    <div>
      <TopBar title="Post a Requirement" backHref="/buyer/requirements" />
      <form onSubmit={submit} className="space-y-5 px-4 py-4">
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">What do you need?</h3>
          <select className="input-field" value={form.produceCategoryId} onChange={(e) => set("produceCategoryId", e.target.value)}>
            <option value="">Select product…</option>
            {Object.entries(grouped).map(([family, items]) => (
              <optgroup key={family} label={family}>
                {items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            <select className="input-field" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              <option value="kg">kg</option><option value="tonnes">tonnes</option><option value="boxes">boxes</option><option value="crates">crates</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="number" placeholder="Min quantity (optional)" value={form.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} />
            <input className="input-field" type="number" placeholder="Max quantity (optional)" value={form.maxQuantity} onChange={(e) => set("maxQuantity", e.target.value)} />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">When</h3>
          <input className="input-field" type="date" value={form.requiredDate} onChange={(e) => set("requiredDate", e.target.value)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.recurring} onChange={(e) => set("recurring", e.target.checked)} /> This is a recurring requirement</label>
          {form.recurring && (
            <select className="input-field" value={form.recurringFrequency} onChange={(e) => set("recurringFrequency", e.target.value)}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Delivery</h3>
          <input className="input-field" placeholder="Location label (e.g. Restaurant ABC — Riyadh)" value={form.deliveryLocationLabel} onChange={(e) => set("deliveryLocationLabel", e.target.value)} />
          <input className="input-field" placeholder="Address (optional)" value={form.deliveryAddress} onChange={(e) => set("deliveryAddress", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Latitude" value={form.deliveryLatitude} onChange={(e) => set("deliveryLatitude", e.target.value)} />
            <input className="input-field" placeholder="Longitude" value={form.deliveryLongitude} onChange={(e) => set("deliveryLongitude", e.target.value)} />
          </div>
          <button type="button" onClick={useMyLocation} className="btn-ghost !px-0 text-brand-700">{locating ? "Locating…" : "📍 Use my current location"}</button>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Requirements</h3>
          <input className="input-field" placeholder="Packaging requirement (optional)" value={form.packagingRequirement} onChange={(e) => set("packagingRequirement", e.target.value)} />
          <input className="input-field" placeholder="Quality requirement (optional)" value={form.qualityRequirement} onChange={(e) => set("qualityRequirement", e.target.value)} />
          <select className="input-field" value={form.productionRequirement} onChange={(e) => set("productionRequirement", e.target.value)}>
            <option value="no_preference">No preference</option>
            <option value="organic">Organic only</option>
            <option value="conventional">Conventional</option>
          </select>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Target price (optional)</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="number" placeholder="Min" value={form.minPrice} onChange={(e) => set("minPrice", e.target.value)} />
            <input className="input-field" type="number" placeholder="Max" value={form.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} />
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Posting…" : "Post Requirement"}</button>
      </form>
    </div>
  );
}

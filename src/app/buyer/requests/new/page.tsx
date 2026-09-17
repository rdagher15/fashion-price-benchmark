"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";

type Category = { id: string; family: string; name: string; variety: string | null; defaultUnit: string };

const WINDOW_OPTIONS = [
  { value: "0", label: "Exact date only" },
  { value: "1", label: "± 1 day" },
  { value: "2", label: "± 2 days" },
  { value: "3", label: "± 3 days" },
  { value: "5", label: "± 5 days" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    produceCategoryId: searchParams.get("produce") || "", quantity: "", minQuantity: "", maxQuantity: "", unit: "kg",
    requiredDate: "", dateWindowDays: "2", recurring: false, recurringFrequency: "weekly",
    packagingRequirement: "", qualityRequirement: "", productionRequirement: "no_preference",
    minPrice: "", maxPrice: "", priceUnit: "kg",
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.family] ||= []).push(c);
    return acc;
  }, {});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.produceCategoryId || !form.quantity || !form.requiredDate) {
      setError("Please fill in produce, quantity and required date.");
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined,
      maxQuantity: form.maxQuantity ? Number(form.maxQuantity) : undefined,
      dateWindowDays: Number(form.dateWindowDays),
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
    router.push(`/buyer/requests/${data.requirement.id}`);
  }

  return (
    <div>
      <TopBar title="Place New Request" backHref="/buyer/requests" />
      <form onSubmit={submit} className="space-y-5 px-4 py-4">
        <div className="rounded-xl bg-mustard-50 px-4 py-3 text-xs text-brown-700">
          Your request stays anonymous to farmers — only your business type and general area are shown until you accept a match.
        </div>

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
            <input className="input-field" type="number" placeholder="Required quantity" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            <select className="input-field" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              <option value="kg">kg</option><option value="tonnes">tonnes</option><option value="boxes">boxes</option><option value="crates">crates</option>
            </select>
          </div>
          <input className="input-field" type="number" placeholder="Minimum acceptable quantity (optional)" value={form.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">When</h3>
          <div><label className="label">Required delivery date</label><input className="input-field" type="date" value={form.requiredDate} onChange={(e) => set("requiredDate", e.target.value)} /></div>
          <div>
            <label className="label">Acceptable date window</label>
            <select className="input-field" value={form.dateWindowDays} onChange={(e) => set("dateWindowDays", e.target.value)}>
              {WINDOW_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.recurring} onChange={(e) => set("recurring", e.target.checked)} /> This is a recurring request</label>
          {form.recurring && (
            <select className="input-field" value={form.recurringFrequency} onChange={(e) => set("recurringFrequency", e.target.value)}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Quality &amp; specification</h3>
          <input className="input-field" placeholder="Required specification / variety (optional)" value={form.qualityRequirement} onChange={(e) => set("qualityRequirement", e.target.value)} />
          <input className="input-field" placeholder="Packaging requirement (optional)" value={form.packagingRequirement} onChange={(e) => set("packagingRequirement", e.target.value)} />
          <select className="input-field" value={form.productionRequirement} onChange={(e) => set("productionRequirement", e.target.value)}>
            <option value="no_preference">No preference</option>
            <option value="organic">Organic only</option>
            <option value="conventional">Conventional</option>
          </select>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Price</h3>
          <div><label className="label">Maximum price willing to pay</label><input className="input-field" type="number" placeholder="Max $/unit" value={form.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} /></div>
          <div><label className="label">Preferred price range (optional)</label><input className="input-field" type="number" placeholder="Min $/unit" value={form.minPrice} onChange={(e) => set("minPrice", e.target.value)} /></div>
        </section>

        <section className="space-y-1 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
          🚚 Delivery to your registered business location.
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Submitting…" : "Submit Request"}</button>
      </form>
    </div>
  );
}

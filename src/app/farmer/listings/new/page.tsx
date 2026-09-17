"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { PACKAGING_TYPES, DELIVERY_METHODS } from "@/lib/constants";

type Category = { id: string; family: string; name: string; variety: string | null; defaultUnit: string };

export default function NewListingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    produceCategoryId: "", variety: "", photoUrl: "",
    quantity: "", unit: "kg", minOrderQuantity: "",
    availableFrom: "", availableUntil: "", readyDate: "",
    grade: "", sizeSpec: "", qualityLevel: "", productionMethod: "conventional", certificationNote: "",
    packagingType: "box", unitsPerPackage: "", packageWeight: "",
    deliveryMethods: ["buyer_pickup"] as string[], deliveryRadiusKm: "", deliveryCost: "",
    minPrice: "", preferredPrice: "", maxPrice: "", priceUnit: "kg",
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleDelivery(method: string) {
    setForm((f) => ({
      ...f,
      deliveryMethods: f.deliveryMethods.includes(method)
        ? f.deliveryMethods.filter((m) => m !== method)
        : [...f.deliveryMethods, method],
    }));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) set("photoUrl", data.url);
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.family] ||= []).push(c);
    return acc;
  }, {});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.produceCategoryId || !form.quantity || !form.availableFrom || !form.availableUntil || !form.minPrice) {
      setError("Please fill in produce, quantity, availability and minimum price.");
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      minOrderQuantity: form.minOrderQuantity ? Number(form.minOrderQuantity) : undefined,
      unitsPerPackage: form.unitsPerPackage ? Number(form.unitsPerPackage) : undefined,
      packageWeight: form.packageWeight ? Number(form.packageWeight) : undefined,
      deliveryRadiusKm: form.deliveryRadiusKm ? Number(form.deliveryRadiusKm) : undefined,
      deliveryCost: form.deliveryCost ? Number(form.deliveryCost) : undefined,
      minPrice: Number(form.minPrice),
      preferredPrice: form.preferredPrice ? Number(form.preferredPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
      readyDate: form.readyDate || undefined,
    };
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError("Please check the form and try again."); return; }
    router.push(`/farmer/listings/${data.listing.id}`);
  }

  return (
    <div>
      <TopBar title="Add New Listing" backHref="/farmer/listings" />
      <form onSubmit={submit} className="space-y-5 px-4 py-4">
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Produce</h3>
          <select className="input-field" value={form.produceCategoryId} onChange={(e) => set("produceCategoryId", e.target.value)}>
            <option value="">Select product…</option>
            {Object.entries(grouped).map(([family, items]) => (
              <optgroup key={family} label={family}>
                {items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
          <input className="input-field" placeholder="Variety (optional)" value={form.variety} onChange={(e) => set("variety", e.target.value)} />
          <div>
            <label className="label">Photo</label>
            <input type="file" accept="image/*" onChange={handleFile} className="text-sm" />
            {uploading && <p className="text-xs text-gray-400">Uploading…</p>}
            {form.photoUrl && <img src={form.photoUrl} alt="Produce" className="mt-2 h-28 w-full rounded-lg object-cover" />}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Quantity</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="number" placeholder="Available quantity" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            <select className="input-field" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              <option value="kg">kg</option><option value="tonnes">tonnes</option><option value="boxes">boxes</option><option value="crates">crates</option>
            </select>
          </div>
          <input className="input-field" type="number" placeholder="Minimum order quantity (optional)" value={form.minOrderQuantity} onChange={(e) => set("minOrderQuantity", e.target.value)} />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Availability</h3>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Available from</label><input className="input-field" type="date" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} /></div>
            <div><label className="label">Available until</label><input className="input-field" type="date" value={form.availableUntil} onChange={(e) => set("availableUntil", e.target.value)} /></div>
          </div>
          <div><label className="label">Exact ready date (optional)</label><input className="input-field" type="date" value={form.readyDate} onChange={(e) => set("readyDate", e.target.value)} /></div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Quality</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Grade" value={form.grade} onChange={(e) => set("grade", e.target.value)} />
            <input className="input-field" placeholder="Size" value={form.sizeSpec} onChange={(e) => set("sizeSpec", e.target.value)} />
          </div>
          <select className="input-field" value={form.productionMethod} onChange={(e) => set("productionMethod", e.target.value)}>
            <option value="conventional">Conventional</option>
            <option value="organic">Organic</option>
          </select>
          <input className="input-field" placeholder="Certification (optional)" value={form.certificationNote} onChange={(e) => set("certificationNote", e.target.value)} />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Packaging</h3>
          <select className="input-field" value={form.packagingType} onChange={(e) => set("packagingType", e.target.value)}>
            {PACKAGING_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="number" placeholder="Units per package" value={form.unitsPerPackage} onChange={(e) => set("unitsPerPackage", e.target.value)} />
            <input className="input-field" type="number" placeholder="Package weight" value={form.packageWeight} onChange={(e) => set("packageWeight", e.target.value)} />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Delivery</h3>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_METHODS.map((m) => (
              <button type="button" key={m.value} onClick={() => toggleDelivery(m.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${form.deliveryMethods.includes(m.value) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}>
                {m.label}
              </button>
            ))}
          </div>
          {form.deliveryMethods.includes("farmer_delivery") && (
            <div className="grid grid-cols-2 gap-2">
              <input className="input-field" type="number" placeholder="Delivery radius (km)" value={form.deliveryRadiusKm} onChange={(e) => set("deliveryRadiusKm", e.target.value)} />
              <input className="input-field" type="number" placeholder="Delivery cost (optional)" value={form.deliveryCost} onChange={(e) => set("deliveryCost", e.target.value)} />
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Price expectation</h3>
          <div className="grid grid-cols-3 gap-2">
            <input className="input-field" type="number" placeholder="Min" value={form.minPrice} onChange={(e) => set("minPrice", e.target.value)} />
            <input className="input-field" type="number" placeholder="Preferred" value={form.preferredPrice} onChange={(e) => set("preferredPrice", e.target.value)} />
            <input className="input-field" type="number" placeholder="Max" value={form.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} />
          </div>
          <select className="input-field" value={form.priceUnit} onChange={(e) => set("priceUnit", e.target.value)}>
            <option value="kg">SAR / kg</option><option value="tonne">SAR / tonne</option><option value="box">SAR / box</option><option value="crate">SAR / crate</option>
          </select>
          <p className="text-xs text-gray-500">This range will be shown to matching buyers. Offers inside it are flagged for easy acceptance.</p>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Publishing…" : "Publish Listing"}</button>
      </form>
    </div>
  );
}

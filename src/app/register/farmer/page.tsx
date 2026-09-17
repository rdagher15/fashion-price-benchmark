"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Category = { id: string; family: string; name: string; variety: string | null; defaultUnit: string };
type ProduceRow = { produceCategoryId: string; typicalQuantity: string; unit: string; productionFrequency: string; productionSeason: string };

const STEPS = ["Personal", "Farm", "Production", "Logistics", "Review"];

export default function FarmerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", mobile: "", email: "", password: "",
    nationality: "", preferredLanguage: "en",
    farmName: "", region: "", city: "", latitude: "", longitude: "",
    farmSizeValue: "", farmSizeUnit: "hectares", farmType: "family", yearsOperating: "", numWorkers: "",
    hasOwnVehicle: false, vehicleType: "", vehicleCapacity: "", refrigerated: false, deliveryRadiusKm: "",
    canDeliver: false, allowPickup: true, sharedDelivery: false,
  });
  const [produce, setProduce] = useState<ProduceRow[]>([{ produceCategoryId: "", typicalQuantity: "", unit: "kg", productionFrequency: "weekly", productionSeason: "" }]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", String(pos.coords.latitude));
        set("longitude", String(pos.coords.longitude));
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  function addProduceRow() {
    setProduce((p) => [...p, { produceCategoryId: "", typicalQuantity: "", unit: "kg", productionFrequency: "weekly", productionSeason: "" }]);
  }
  function updateProduceRow(i: number, patch: Partial<ProduceRow>) {
    setProduce((p) => p.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeProduceRow(i: number) {
    setProduce((p) => p.filter((_, idx) => idx !== i));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.mobile || !form.email || form.password.length < 6)
        return "Please fill in all required fields (password ≥ 6 characters).";
    }
    if (step === 1) {
      if (!form.farmName || !form.region || !form.city) return "Please fill in your farm name, region and city.";
    }
    if (step === 2) {
      if (!produce.some((p) => p.produceCategoryId)) return "Add at least one product you grow.";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      farmSizeValue: form.farmSizeValue ? Number(form.farmSizeValue) : undefined,
      yearsOperating: form.yearsOperating ? Number(form.yearsOperating) : undefined,
      numWorkers: form.numWorkers ? Number(form.numWorkers) : undefined,
      deliveryRadiusKm: form.deliveryRadiusKm ? Number(form.deliveryRadiusKm) : undefined,
      produce: produce
        .filter((p) => p.produceCategoryId)
        .map((p) => ({
          produceCategoryId: p.produceCategoryId,
          typicalQuantity: p.typicalQuantity ? Number(p.typicalQuantity) : undefined,
          unit: p.unit,
          productionFrequency: p.productionFrequency,
          productionSeason: p.productionSeason,
        })),
    };
    const res = await fetch("/api/auth/register/farmer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Please check the form and try again.");
      return;
    }
    router.push("/farmer");
    router.refresh();
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.family] ||= []).push(c);
    return acc;
  }, {});

  return (
    <main className="flex min-h-dvh flex-col px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/" className="text-lg text-gray-500">←</Link>
        <span className="text-sm font-semibold text-gray-500">Farmer registration</span>
      </div>

      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-[11px] font-medium text-gray-400">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? "text-brand-700" : ""}>{s}</span>
          ))}
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-brand-600 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {step === 0 && (
          <>
            <h2 className="text-lg font-bold">Tell us about you</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First name</label><input className="input-field" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
              <div><label className="label">Last name</label><input className="input-field" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
            </div>
            <div><label className="label">Mobile number</label><input className="input-field" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label className="label">Password</label><input className="input-field" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
            <div><label className="label">Nationality</label><input className="input-field" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} /></div>
            <div>
              <label className="label">Preferred language</label>
              <select className="input-field" value={form.preferredLanguage} onChange={(e) => set("preferredLanguage", e.target.value)}>
                <option value="en">English</option>
                <option value="ar" disabled>العربية (coming soon)</option>
              </select>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold">Your farm</h2>
            <div><label className="label">Farm name</label><input className="input-field" value={form.farmName} onChange={(e) => set("farmName", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Region</label><input className="input-field" value={form.region} onChange={(e) => set("region", e.target.value)} /></div>
              <div><label className="label">City / area</label><input className="input-field" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            </div>
            <div>
              <label className="label">Farm location (pin on map)</label>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Latitude" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
                <input className="input-field" placeholder="Longitude" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
              </div>
              <button type="button" onClick={useMyLocation} className="btn-ghost mt-1 !px-0 text-brand-700">
                {locating ? "Locating…" : "📍 Use my current location"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Farm size</label><input className="input-field" value={form.farmSizeValue} onChange={(e) => set("farmSizeValue", e.target.value)} /></div>
              <div>
                <label className="label">Unit</label>
                <select className="input-field" value={form.farmSizeUnit} onChange={(e) => set("farmSizeUnit", e.target.value)}>
                  <option value="hectares">Hectares</option>
                  <option value="acres">Acres</option>
                  <option value="dunums">Dunums</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Type of farm</label>
              <select className="input-field" value={form.farmType} onChange={(e) => set("farmType", e.target.value)}>
                <option value="family">Family farm</option>
                <option value="commercial">Commercial farm</option>
                <option value="cooperative">Cooperative</option>
                <option value="smallholder">Smallholder</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Years operating</label><input className="input-field" value={form.yearsOperating} onChange={(e) => set("yearsOperating", e.target.value)} /></div>
              <div><label className="label"># of workers</label><input className="input-field" value={form.numWorkers} onChange={(e) => set("numWorkers", e.target.value)} /></div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold">What do you produce?</h2>
            <p className="text-sm text-gray-500">Add each product you grow. You can list specific batches later.</p>
            {produce.map((row, i) => (
              <div key={i} className="card space-y-2">
                <select className="input-field" value={row.produceCategoryId} onChange={(e) => updateProduceRow(i, { produceCategoryId: e.target.value })}>
                  <option value="">Select product…</option>
                  {Object.entries(grouped).map(([family, items]) => (
                    <optgroup key={family} label={family}>
                      {items.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-field" placeholder="Typical quantity" value={row.typicalQuantity} onChange={(e) => updateProduceRow(i, { typicalQuantity: e.target.value })} />
                  <select className="input-field" value={row.unit} onChange={(e) => updateProduceRow(i, { unit: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="tonnes">tonnes</option>
                    <option value="boxes">boxes</option>
                    <option value="crates">crates</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input-field" value={row.productionFrequency} onChange={(e) => updateProduceRow(i, { productionFrequency: e.target.value })}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                  <input className="input-field" placeholder="Season (e.g. Sep–Nov)" value={row.productionSeason} onChange={(e) => updateProduceRow(i, { productionSeason: e.target.value })} />
                </div>
                {produce.length > 1 && (
                  <button type="button" onClick={() => removeProduceRow(i)} className="text-xs font-semibold text-red-500">Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addProduceRow} className="btn-secondary">+ Add another product</button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold">Delivery & logistics</h2>
            <div className="card">
              <p className="mb-2 text-sm font-semibold">Do you have your own vehicle for delivery?</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => set("hasOwnVehicle", true)} className={form.hasOwnVehicle ? "btn-primary !py-2" : "btn-secondary !py-2"}>Yes</button>
                <button type="button" onClick={() => set("hasOwnVehicle", false)} className={!form.hasOwnVehicle ? "btn-primary !py-2" : "btn-secondary !py-2"}>No</button>
              </div>
            </div>
            {form.hasOwnVehicle ? (
              <div className="card space-y-2">
                <div><label className="label">Vehicle type</label><input className="input-field" value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)} placeholder="e.g. Pickup truck" /></div>
                <div><label className="label">Approx. capacity</label><input className="input-field" value={form.vehicleCapacity} onChange={(e) => set("vehicleCapacity", e.target.value)} placeholder="e.g. 2 tonnes" /></div>
                <div><label className="label">Delivery radius (km)</label><input className="input-field" value={form.deliveryRadiusKm} onChange={(e) => set("deliveryRadiusKm", e.target.value)} /></div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.refrigerated} onChange={(e) => set("refrigerated", e.target.checked)} /> Refrigerated vehicle
                </label>
                {(() => { if (!form.canDeliver) set("canDeliver", true); return null; })()}
              </div>
            ) : (
              <div className="card space-y-2">
                <p className="text-sm text-gray-500">No problem — choose how buyers can get your produce:</p>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowPickup} onChange={(e) => set("allowPickup", e.target.checked)} /> Buyer pickup</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.sharedDelivery} onChange={(e) => set("sharedDelivery", e.target.checked)} /> Shared delivery with another farmer / third party</label>
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-bold">Review & create account</h2>
            <div className="card space-y-1 text-sm">
              <p><strong>{form.firstName} {form.lastName}</strong> · {form.email}</p>
              <p>{form.farmName} — {form.city}, {form.region}</p>
              <p>{produce.filter(p=>p.produceCategoryId).length} product(s) added</p>
              <p>{form.hasOwnVehicle ? "Own vehicle delivery" : "Buyer pickup / shared delivery"}</p>
            </div>
            <p className="text-xs text-gray-500">You can add farm photos, certifications and support details later from your profile.</p>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && <button onClick={back} className="btn-secondary">Back</button>}
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="btn-primary">Next</button>
        ) : (
          <button onClick={submit} disabled={loading} className="btn-primary">{loading ? "Creating account…" : "Create account"}</button>
        )}
      </div>
    </main>
  );
}

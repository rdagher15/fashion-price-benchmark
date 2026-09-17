"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LEBANON_GOVERNORATES, LEBANON_CITIES, OPERATOR_POSITIONS, DEMAND_FREQUENCIES } from "@/lib/constants";

type Category = { id: string; family: string; name: string };
type BusinessType = { value: string; label: string };
type DemandRow = { produceCategoryId: string; typicalQuantity: string; unit: string; frequency: string };

const STEPS = ["Operator", "Business", "Location", "Demand", "Review"];

export default function BuyerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [uploadingCr, setUploadingCr] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", mobile: "", email: "", password: "", position: OPERATOR_POSITIONS[0],
    businessName: "", crNumber: "", crDocumentUrl: "", buyerType: "restaurant", businessPhone: "", businessEmail: "",
    governorate: Object.keys(LEBANON_GOVERNORATES)[0], caza: "", city: "", street: "",
    latitude: "", longitude: "", businessPhotoUrl: "",
  });
  const [demand, setDemand] = useState<DemandRow[]>([{ produceCategoryId: "", typicalQuantity: "", unit: "kg", frequency: "weekly" }]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
    fetch("/api/business-types").then((r) => r.json()).then((d) => setBusinessTypes(d.types || []));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const cazaOptions = LEBANON_GOVERNORATES[form.governorate] || [];
  const cityQuickPicks = LEBANON_CITIES.filter((c) => c.governorate === form.governorate);

  function pickCity(c: (typeof LEBANON_CITIES)[number]) {
    setForm((f) => ({ ...f, caza: c.caza, city: c.name, latitude: String(c.lat), longitude: String(c.lng) }));
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

  async function uploadFile(file: File, publicOnly: boolean): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(publicOnly ? "/api/upload/public" : "/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    return res.ok ? data.url : null;
  }

  async function handleCrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCr(true);
    const url = await uploadFile(file, true);
    if (url) set("crDocumentUrl", url);
    setUploadingCr(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const url = await uploadFile(file, true);
    if (url) set("businessPhotoUrl", url);
    setUploadingPhoto(false);
  }

  function addDemandRow() {
    setDemand((d) => [...d, { produceCategoryId: "", typicalQuantity: "", unit: "kg", frequency: "weekly" }]);
  }
  function updateDemandRow(i: number, patch: Partial<DemandRow>) {
    setDemand((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeDemandRow(i: number) {
    setDemand((d) => d.filter((_, idx) => idx !== i));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.mobile || !form.email || form.password.length < 6)
        return "Please fill in all required fields (password ≥ 6 characters).";
    }
    if (step === 1) {
      if (!form.businessName || !form.buyerType) return "Please fill in your business name and type.";
    }
    if (step === 2) {
      if (!form.governorate || !form.city) return "Please select your governorate and city.";
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
      demandProfile: demand
        .filter((d) => d.produceCategoryId && d.typicalQuantity)
        .map((d) => ({ produceCategoryId: d.produceCategoryId, typicalQuantity: Number(d.typicalQuantity), unit: d.unit, frequency: d.frequency })),
    };
    const res = await fetch("/api/auth/register/buyer", {
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
    router.push("/buyer");
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
        <span className="text-sm font-semibold text-gray-500">Retailer registration</span>
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
            <h2 className="text-lg font-bold">About you</h2>
            <p className="text-sm text-gray-500">First, register yourself as the operator. You'll add your business next.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First name</label><input className="input-field" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
              <div><label className="label">Last name</label><input className="input-field" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
            </div>
            <div><label className="label">Mobile number</label><input className="input-field" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label className="label">Password</label><input className="input-field" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
            <div>
              <label className="label">Your position / role</label>
              <select className="input-field" value={form.position} onChange={(e) => set("position", e.target.value)}>
                {OPERATOR_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold">Your business</h2>
            <div><label className="label">Business / company name</label><input className="input-field" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} /></div>
            <div>
              <label className="label">Business type</label>
              <select className="input-field" value={form.buyerType} onChange={(e) => set("buyerType", e.target.value)}>
                {businessTypes.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div><label className="label">Commercial Registration (CR) number</label><input className="input-field" value={form.crNumber} onChange={(e) => set("crNumber", e.target.value)} /></div>
            <div>
              <label className="label">Upload CR document</label>
              <input type="file" accept="image/*,application/pdf" onChange={handleCrUpload} className="text-sm" />
              {uploadingCr && <p className="text-xs text-gray-400">Uploading…</p>}
              {form.crDocumentUrl && <p className="text-xs text-brand-700">✓ Document uploaded</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Business phone</label><input className="input-field" value={form.businessPhone} onChange={(e) => set("businessPhone", e.target.value)} /></div>
              <div><label className="label">Business email</label><input className="input-field" value={form.businessEmail} onChange={(e) => set("businessEmail", e.target.value)} /></div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold">Business location</h2>
            <p className="text-sm text-gray-500">Exact coordinates drive matching &amp; delivery — please pin your precise location.</p>
            <div>
              <label className="label">Governorate</label>
              <select className="input-field" value={form.governorate} onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value, caza: "" }))}>
                {Object.keys(LEBANON_GOVERNORATES).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Caza / District</label>
              <select className="input-field" value={form.caza} onChange={(e) => set("caza", e.target.value)}>
                <option value="">Select…</option>
                {cazaOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {cityQuickPicks.length > 0 && (
              <div>
                <label className="label">Quick-select a city (autofills coordinates)</label>
                <div className="flex flex-wrap gap-2">
                  {cityQuickPicks.map((c) => (
                    <button type="button" key={c.name} onClick={() => pickCity(c)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${form.city === c.name ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div><label className="label">City / Municipality</label><input className="input-field" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><label className="label">Street</label><input className="input-field" value={form.street} onChange={(e) => set("street", e.target.value)} /></div>
            <div>
              <label className="label">Exact location (pin on map)</label>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Latitude" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
                <input className="input-field" placeholder="Longitude" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
              </div>
              <button type="button" onClick={useMyLocation} className="btn-ghost mt-1 !px-0 text-brand-700">
                {locating ? "Locating…" : "📍 Use my current location"}
              </button>
            </div>
            <div>
              <label className="label">Photo of your location (storefront, entrance, warehouse…)</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm" />
              {uploadingPhoto && <p className="text-xs text-gray-400">Uploading…</p>}
              {form.businessPhotoUrl && <img src={form.businessPhotoUrl} alt="" className="mt-2 h-28 w-full rounded-lg object-cover" />}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold">What do you typically purchase?</h2>
            <p className="text-sm text-gray-500">This is your recurring demand profile — not an order. It helps us plan matches for you.</p>
            {demand.map((row, i) => (
              <div key={i} className="card space-y-2">
                <select className="input-field" value={row.produceCategoryId} onChange={(e) => updateDemandRow(i, { produceCategoryId: e.target.value })}>
                  <option value="">Select product…</option>
                  {Object.entries(grouped).map(([family, items]) => (
                    <optgroup key={family} label={family}>
                      {items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-field" placeholder="Typical quantity" value={row.typicalQuantity} onChange={(e) => updateDemandRow(i, { typicalQuantity: e.target.value })} />
                  <select className="input-field" value={row.unit} onChange={(e) => updateDemandRow(i, { unit: e.target.value })}>
                    <option value="kg">kg</option><option value="tonnes">tonnes</option><option value="boxes">boxes</option><option value="crates">crates</option>
                  </select>
                </div>
                <select className="input-field" value={row.frequency} onChange={(e) => updateDemandRow(i, { frequency: e.target.value })}>
                  {DEMAND_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                {demand.length > 1 && <button type="button" onClick={() => removeDemandRow(i)} className="text-xs font-semibold text-red-500">Remove</button>}
              </div>
            ))}
            <button type="button" onClick={addDemandRow} className="btn-secondary">+ Add another product</button>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-bold">Review &amp; create account</h2>
            <div className="card space-y-1 text-sm">
              <p><strong>{form.firstName} {form.lastName}</strong> · {form.position} · {form.email}</p>
              <p>{form.businessName} — {form.city}, {form.governorate}</p>
              <p>{form.crDocumentUrl ? "✓ CR document uploaded" : "No CR document uploaded yet"}</p>
              <p>{demand.filter((d) => d.produceCategoryId).length} recurring product(s) in demand profile</p>
            </div>
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

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BUYER_TYPES } from "@/lib/constants";

const STEPS = ["Account", "Business", "Delivery"];

export default function BuyerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", mobile: "", email: "", password: "",
    businessName: "", buyerType: "restaurant", contactPerson: "", businessRegistrationInfo: "",
    region: "", city: "", latitude: "", longitude: "",
    deliveryLabel: "Main location", deliveryAddress: "",
  });

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

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.firstName || !form.lastName || !form.mobile || !form.email || form.password.length < 6)
        return "Please fill in all required fields (password ≥ 6 characters).";
    }
    if (step === 1) {
      if (!form.businessName || !form.region || !form.city) return "Please fill in your business name, region and city.";
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
      deliveryLocations: [
        {
          label: form.deliveryLabel || "Main location",
          address: form.deliveryAddress || `${form.city}, ${form.region}`,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          isPrimary: true,
        },
      ],
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

  return (
    <main className="flex min-h-dvh flex-col px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/" className="text-lg text-gray-500">←</Link>
        <span className="text-sm font-semibold text-gray-500">Buyer registration</span>
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
            <h2 className="text-lg font-bold">Create your account</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First name</label><input className="input-field" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
              <div><label className="label">Last name</label><input className="input-field" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
            </div>
            <div><label className="label">Mobile number</label><input className="input-field" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input-field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label className="label">Password</label><input className="input-field" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold">Your business</h2>
            <div><label className="label">Business name</label><input className="input-field" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} /></div>
            <div>
              <label className="label">Buyer type</label>
              <select className="input-field" value={form.buyerType} onChange={(e) => set("buyerType", e.target.value)}>
                {BUYER_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div><label className="label">Contact person</label><input className="input-field" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} /></div>
            <div><label className="label">Business registration info (optional)</label><input className="input-field" value={form.businessRegistrationInfo} onChange={(e) => set("businessRegistrationInfo", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Region</label><input className="input-field" value={form.region} onChange={(e) => set("region", e.target.value)} /></div>
              <div><label className="label">City</label><input className="input-field" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold">Primary delivery location</h2>
            <div><label className="label">Label</label><input className="input-field" value={form.deliveryLabel} onChange={(e) => set("deliveryLabel", e.target.value)} /></div>
            <div><label className="label">Address</label><input className="input-field" value={form.deliveryAddress} onChange={(e) => set("deliveryAddress", e.target.value)} placeholder="Street, city" /></div>
            <div>
              <label className="label">Coordinates (pin on map)</label>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Latitude" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
                <input className="input-field" placeholder="Longitude" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
              </div>
              <button type="button" onClick={useMyLocation} className="btn-ghost mt-1 !px-0 text-brand-700">
                {locating ? "Locating…" : "📍 Use my current location"}
              </button>
            </div>
            <p className="text-xs text-gray-500">You can add more delivery locations later from your profile.</p>
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

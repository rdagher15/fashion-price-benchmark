"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Config = { weightProduce: number; weightQuantity: number; weightDate: number; weightGeo: number; weightDelivery: number; weightPrice: number; maxDistanceKm: number };

const FIELDS: { key: keyof Config; label: string }[] = [
  { key: "weightProduce", label: "Produce match" },
  { key: "weightQuantity", label: "Quantity match" },
  { key: "weightDate", label: "Date match" },
  { key: "weightGeo", label: "Geographic proximity" },
  { key: "weightDelivery", label: "Delivery capability" },
  { key: "weightPrice", label: "Price compatibility" },
];

export default function MatchingWeightsEditor({ config }: { config: Config }) {
  const router = useRouter();
  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = FIELDS.reduce((sum, f) => sum + (form[f.key] as number), 0);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/matching-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-bold text-gray-800">Matching weights</h3>
      <p className="text-xs text-gray-500">Current total: {total}% (weights are normalized automatically).</p>
      {FIELDS.map((f) => (
        <div key={f.key} className="flex items-center justify-between gap-2">
          <label className="text-sm text-gray-700">{f.label}</label>
          <input
            type="number"
            className="input-field w-20"
            value={form[f.key]}
            onChange={(e) => setForm((s) => ({ ...s, [f.key]: Number(e.target.value) }))}
          />
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm text-gray-700">Max distance (km)</label>
        <input type="number" className="input-field w-20" value={form.maxDistanceKm} onChange={(e) => setForm((s) => ({ ...s, maxDistanceKm: Number(e.target.value) }))} />
      </div>
      <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save weights"}</button>
      {saved && <p className="text-center text-xs text-brand-700">Saved — new matches will use these weights.</p>}
    </div>
  );
}

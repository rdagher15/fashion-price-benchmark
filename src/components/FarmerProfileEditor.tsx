"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORT_TYPES } from "@/lib/constants";

type Photo = { id: string; url: string; category: string };

export default function FarmerProfileEditor({
  supportTypes,
  supportDescription,
  usesPesticides,
  usesFertilizers,
  organic,
  farmingNotes,
  photos,
}: {
  supportTypes: string[];
  supportDescription: string;
  usesPesticides: boolean | null;
  usesFertilizers: boolean | null;
  organic: boolean;
  farmingNotes: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const [support, setSupport] = useState<string[]>(supportTypes);
  const [desc, setDesc] = useState(supportDescription);
  const [pesticides, setPesticides] = useState<boolean | null>(usesPesticides);
  const [fertilizers, setFertilizers] = useState<boolean | null>(usesFertilizers);
  const [isOrganic, setIsOrganic] = useState(organic);
  const [notes, setNotes] = useState(farmingNotes);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  function toggleSupport(v: string) {
    setSupport((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  }

  async function save() {
    setSaving(true);
    setSavedMsg("");
    await fetch("/api/farmer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supportTypes: support,
        supportDescription: desc,
        usesPesticides: pesticides ?? undefined,
        usesFertilizers: fertilizers ?? undefined,
        organic: isOrganic,
        conventional: !isOrganic,
        farmingNotes: notes,
      }),
    });
    setSaving(false);
    setSavedMsg("Saved");
    router.refresh();
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      await fetch("/api/farmer/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url, category: "other" }),
      });
      router.refresh();
    }
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <h3 className="text-sm font-bold text-gray-800">Support & sustainability</h3>
        <p className="text-xs text-gray-500">Are you currently receiving any support?</p>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => toggleSupport(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${support.includes(t) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}>
              {t}
            </button>
          ))}
        </div>
        {support.length > 0 && <textarea className="input-field" rows={2} placeholder="Describe your support" value={desc} onChange={(e) => setDesc(e.target.value)} />}

        <p className="pt-2 text-xs text-gray-500">Production practices</p>
        <TriToggle label="Do you use pesticides?" value={pesticides} onChange={setPesticides} />
        <TriToggle label="Do you use fertilizers?" value={fertilizers} onChange={setFertilizers} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isOrganic} onChange={(e) => setIsOrganic(e.target.checked)} /> Organic production</label>
        <textarea className="input-field" rows={2} placeholder="Other farming practices / notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
        {savedMsg && <p className="text-center text-xs text-brand-700">{savedMsg}</p>}
      </div>

      <div className="card space-y-2">
        <h3 className="text-sm font-bold text-gray-800">Farm photos</h3>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => <img key={p.id} src={p.url} className="h-20 w-full rounded-lg object-cover" alt="" />)}
        </div>
        <input type="file" accept="image/*" onChange={handlePhoto} className="text-sm" />
        {uploading && <p className="text-xs text-gray-400">Uploading…</p>}
      </div>
    </div>
  );
}

function TriToggle({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{label}</span>
      <div className="flex gap-1">
        <button type="button" onClick={() => onChange(true)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value === true ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>Yes</button>
        <button type="button" onClick={() => onChange(false)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value === false ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>No</button>
      </div>
    </div>
  );
}

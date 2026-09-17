"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS, DISCREPANCY_TYPES } from "@/lib/constants";

type OriginalSpec = { grade: string | null; qualityLevel: string | null; productionMethod: string; packagingType: string | null; qualityRequirement: string | null };

export default function BuyerOrderActions({
  orderId,
  status,
  expectedQuantity,
  unit,
  originalSpec,
}: {
  orderId: string;
  status: string;
  expectedQuantity: number;
  unit: string;
  originalSpec: OriginalSpec;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "inspect" | "sign" | "discrepancy">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Inspection
  const [receivedQuantity, setReceivedQuantity] = useState(String(expectedQuantity));
  const [quantityCorrect, setQuantityCorrect] = useState(true);
  const [qualityConfirmed, setQualityConfirmed] = useState(true);
  const [packagingConfirmed, setPackagingConfirmed] = useState(true);
  const [deliveryAcceptable, setDeliveryAcceptable] = useState(true);
  const [receivedCondition, setReceivedCondition] = useState<"good" | "damaged" | "partial">("good");
  const [receivedNote, setReceivedNote] = useState("");

  // Signature
  const [signatureName, setSignatureName] = useState("");
  const [captureLocation, setCaptureLocation] = useState(true);

  // Discrepancy
  const [discTypes, setDiscTypes] = useState<string[]>([]);
  const [discNote, setDiscNote] = useState("");
  const [discPhotos, setDiscPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  if (status !== ORDER_STATUS.DELIVERED) return null;

  function toggleDiscType(v: string) {
    setDiscTypes((t) => (t.includes(v) ? t.filter((x) => x !== v) : [...t, v]));
  }

  async function uploadDiscPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingPhoto(false);
    if (res.ok) setDiscPhotos((p) => [...p, data.url]);
  }

  function getLocation(): Promise<{ lat?: number; lng?: number }> {
    return new Promise((resolve) => {
      if (!captureLocation || !navigator.geolocation) return resolve({});
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({})
      );
    });
  }

  async function submitAccept() {
    if (!signatureName.trim()) { setError("Please type your name to sign."); return; }
    setLoading(true);
    setError("");
    const { lat, lng } = await getLocation();
    const res = await fetch(`/api/orders/${orderId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receivedQuantity: Number(receivedQuantity),
        receivedCondition,
        receivedNote,
        quantityCorrect,
        qualityConfirmed,
        packagingConfirmed,
        deliveryAcceptable,
        signatureName,
        signatureLatitude: lat,
        signatureLongitude: lng,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Could not confirm receipt"); return; }
    router.refresh();
  }

  async function submitDiscrepancy() {
    if (discTypes.length === 0) { setError("Select at least one issue."); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/discrepancy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ types: discTypes, note: discNote, actualQuantity: receivedQuantity ? Number(receivedQuantity) : undefined, photoUrls: discPhotos }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Could not report discrepancy"); return; }
    router.refresh();
  }

  if (mode === "idle") {
    return (
      <div className="card space-y-2 border-mustard-300 bg-mustard-50/40">
        <p className="text-sm font-semibold text-gray-800">Delivery arrived — inspection required</p>
        <button className="btn-primary" onClick={() => setMode("inspect")}>Inspect Delivery</button>
      </div>
    );
  }

  if (mode === "inspect") {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-bold">Inspect against your request</h3>
        <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
          <p><strong>Expected:</strong> {expectedQuantity} {unit}</p>
          <p><strong>Original spec:</strong> {[originalSpec.grade, originalSpec.qualityLevel, originalSpec.productionMethod, originalSpec.qualityRequirement].filter(Boolean).join(" · ") || "—"}</p>
          {originalSpec.packagingType && <p><strong>Packaging:</strong> {originalSpec.packagingType}</p>}
        </div>
        <div><label className="label">Quantity received</label><input className="input-field" type="number" value={receivedQuantity} onChange={(e) => setReceivedQuantity(e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={quantityCorrect} onChange={(e) => setQuantityCorrect(e.target.checked)} /> Quantity correct</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={qualityConfirmed} onChange={(e) => setQualityConfirmed(e.target.checked)} /> Quality meets requirements</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={packagingConfirmed} onChange={(e) => setPackagingConfirmed(e.target.checked)} /> Packaging correct</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={deliveryAcceptable} onChange={(e) => setDeliveryAcceptable(e.target.checked)} /> Delivery acceptable</label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setMode("discrepancy")}>Report Discrepancy</button>
          <button className="btn-primary" onClick={() => setMode("sign")}>Accept Delivery</button>
        </div>
      </div>
    );
  }

  if (mode === "sign") {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-bold">Digital delivery confirmation</h3>
        <div><label className="label">Type your full name to sign</label><input className="input-field" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Full name" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={captureLocation} onChange={(e) => setCaptureLocation(e.target.checked)} /> Include my GPS location</label>
        <p className="text-xs text-gray-500">Signing records your name, this quantity/quality/packaging confirmation, and the date &amp; time.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setMode("inspect")}>Back</button>
          <button className="btn-primary" disabled={loading} onClick={submitAccept}>{loading ? "Confirming…" : "Sign & Complete Order"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-bold">Report a discrepancy</h3>
      <div className="flex flex-wrap gap-2">
        {DISCREPANCY_TYPES.map((t) => (
          <button type="button" key={t.value} onClick={() => toggleDiscType(t.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${discTypes.includes(t.value) ? "border-red-400 bg-red-50 text-red-600" : "border-gray-200 text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <textarea className="input-field" rows={2} placeholder="Describe the issue" value={discNote} onChange={(e) => setDiscNote(e.target.value)} />
      <div>
        <label className="label">Photos</label>
        <input type="file" accept="image/*" onChange={uploadDiscPhoto} className="text-sm" />
        {uploadingPhoto && <p className="text-xs text-gray-400">Uploading…</p>}
        {discPhotos.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {discPhotos.map((url) => <img key={url} src={url} className="h-16 w-full rounded object-cover" alt="" />)}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => setMode("inspect")}>Back</button>
        <button className="btn-primary !bg-red-600" disabled={loading} onClick={submitDiscrepancy}>{loading ? "Submitting…" : "Submit Discrepancy Report"}</button>
      </div>
    </div>
  );
}

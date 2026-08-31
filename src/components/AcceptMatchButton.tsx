"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptMatchButton({ requirementId, matchId, label = "Accept Match" }: { requirementId: string; matchId: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/requirements/${requirementId}/accept-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Could not accept this match"); return; }
    router.push(`/buyer/offers/${data.offer.id}`);
    router.refresh();
  }

  return (
    <div>
      <button className="btn-primary" disabled={loading} onClick={accept}>{loading ? "Sending request…" : label}</button>
      {error && <p className="mt-1 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}

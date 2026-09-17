"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SuspendToggle({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" }),
    });
    setLoading(false);
    router.refresh();
  }
  return (
    <button disabled={loading} onClick={toggle} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === "SUSPENDED" ? "bg-brand-100 text-brand-700" : "bg-red-50 text-red-500"}`}>
      {status === "SUSPENDED" ? "Reactivate" : "Suspend"}
    </button>
  );
}

export function VerifyToggle({ profileId, verificationStatus, kind }: { profileId: string; verificationStatus: string; kind: "farmers" | "buyers" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function setStatus(v: string) {
    setLoading(true);
    await fetch(`/api/admin/${kind}/${profileId}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus: v }),
    });
    setLoading(false);
    router.refresh();
  }
  if (verificationStatus === "VERIFIED") {
    return <button disabled={loading} onClick={() => setStatus("PENDING")} className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-700">✅ Verified</button>;
  }
  return (
    <div className="flex gap-1">
      <button disabled={loading} onClick={() => setStatus("VERIFIED")} className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">Approve</button>
      <button disabled={loading} onClick={() => setStatus("REJECTED")} className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-500">Reject</button>
    </div>
  );
}

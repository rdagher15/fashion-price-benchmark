"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push(data.role === "FARMER" ? "/farmer" : data.role === "BUYER" ? "/buyer" : "/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mb-8 flex items-center gap-2">
        <span className="text-3xl">🌾</span>
        <span className="text-xl font-bold text-brand-800">HarvestLink</span>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Welcome back</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input-field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input-field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" disabled={loading} type="submit">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        New to HarvestLink?{" "}
        <Link href="/" className="font-semibold text-brand-700">
          Create an account
        </Link>
      </p>
      <div className="mt-8 rounded-xl bg-cream-100 p-3 text-xs text-brown-600">
        <p className="mb-1 font-semibold text-brown-700">Demo accounts (password: demo1234)</p>
        <p>Farmer (Chouf Terraces Farm, near Beirut): farmer3@harvestlink.demo</p>
        <p>Farmer (Bekaa Valley Farms, clustering demo): farmer1@harvestlink.demo</p>
        <p>Buyer (Beirut Bistro): buyer1@harvestlink.demo</p>
        <p>Admin: admin@harvestlink.demo</p>
      </div>
    </main>
  );
}

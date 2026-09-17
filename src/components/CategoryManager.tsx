"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCE_FAMILIES } from "@/lib/constants";

export default function CategoryManager() {
  const router = useRouter();
  const [family, setFamily] = useState(PRODUCE_FAMILIES[0]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function add() {
    if (!name) return;
    setLoading(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family, name, defaultUnit: unit }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      setMsg(`${name} added.`);
      router.refresh();
    } else {
      setMsg("Could not add product (it may already exist).");
    }
  }

  return (
    <div className="card space-y-2">
      <h3 className="text-sm font-bold text-gray-800">Add produce category</h3>
      <select className="input-field" value={family} onChange={(e) => setFamily(e.target.value)}>
        {PRODUCE_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <input className="input-field" placeholder="Product name (e.g. Zucchini)" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="input-field" value={unit} onChange={(e) => setUnit(e.target.value)}>
        <option value="kg">kg</option><option value="tonnes">tonnes</option><option value="boxes">boxes</option><option value="crates">crates</option>
      </select>
      <button className="btn-primary" disabled={loading} onClick={add}>{loading ? "Adding…" : "Add product"}</button>
      {msg && <p className="text-center text-xs text-gray-500">{msg}</p>}
    </div>
  );
}

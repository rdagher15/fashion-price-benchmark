"use client";
import { useRouter, useSearchParams } from "next/navigation";

type Category = { id: string; family: string; name: string };

export default function SearchFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/buyer/search?${next.toString()}`);
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.family] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="card space-y-2">
      <select className="input-field" defaultValue={params.get("produce") || ""} onChange={(e) => update("produce", e.target.value)}>
        <option value="">All produce</option>
        {Object.entries(grouped).map(([family, items]) => (
          <optgroup key={family} label={family}>
            {items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </optgroup>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <select className="input-field" defaultValue={params.get("sort") || ""} onChange={(e) => update("sort", e.target.value)}>
          <option value="">Newest</option>
          <option value="price">Lowest price</option>
          <option value="distance">Nearest</option>
        </select>
        <input className="input-field" type="number" placeholder="Max price" defaultValue={params.get("maxPrice") || ""} onBlur={(e) => update("maxPrice", e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" defaultChecked={params.get("organic") === "1"} onChange={(e) => update("organic", e.target.checked ? "1" : "")} /> Organic only
      </label>
    </div>
  );
}

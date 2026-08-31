import { prisma } from "@/lib/db";
import { getMatchingConfig } from "@/lib/matching";
import MatchingWeightsEditor from "@/components/MatchingWeightsEditor";
import CategoryManager from "@/components/CategoryManager";

export default async function AdminSettingsPage() {
  const [config, categories] = await Promise.all([
    getMatchingConfig(),
    prisma.produceCategory.findMany({ orderBy: [{ family: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">Settings</h1>
      <MatchingWeightsEditor config={config} />
      <CategoryManager />
      <div className="card">
        <h3 className="mb-2 text-sm font-bold text-gray-800">Produce categories ({categories.length})</h3>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span key={c.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">{c.family} · {c.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

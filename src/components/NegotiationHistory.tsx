import { formatMoney } from "@/lib/format";

type Negotiation = { id: string; sender: string; price: number; quantity: number; rationale: string | null; createdAt: Date | string };

export default function NegotiationHistory({ negotiations, priceUnit }: { negotiations: Negotiation[]; priceUnit: string }) {
  if (negotiations.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-gray-800">Negotiation history</h2>
      <div className="space-y-2">
        {negotiations.map((n) => (
          <div key={n.id} className={`rounded-xl border p-3 text-sm ${n.sender === "FARMER" ? "border-brand-100 bg-brand-50/50" : "border-blue-100 bg-blue-50/50"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-gray-500">{n.sender === "FARMER" ? "Farmer countered" : "Buyer countered"}</span>
              <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <p className="font-semibold">{formatMoney(n.price)}/{priceUnit} × {n.quantity}</p>
            {n.rationale && <p className="text-xs text-gray-500">{n.rationale}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

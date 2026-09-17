import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";
import { StatusPill } from "@/components/StatusPill";
import { formatDate } from "@/lib/format";

export default async function BuyerRequestsPage() {
  const user = await getCurrentUser();
  const profile = user!.buyerProfile!;

  const requirements = await prisma.requirement.findMany({
    where: { buyerProfileId: profile.id },
    include: { produceCategory: true, matches: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <TopBar title="My Requests" />
      <div className="space-y-3 px-4 py-4">
        <Link href="/buyer/requests/new" className="btn-primary block text-center">+ Place New Request</Link>

        {requirements.length === 0 && <p className="pt-8 text-center text-sm text-gray-400">No requests placed yet.</p>}

        {requirements.map((r) => (
          <Link key={r.id} href={`/buyer/requests/${r.id}`} className="card block">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{r.produceCategory.name}</p>
                <p className="text-xs text-gray-500">{r.quantity} {r.unit} · by {formatDate(r.requiredDate)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill status={r.status} />
                {r.matches.length > 0 && <span className="text-[11px] text-gray-400">{r.matches.length} match(es)</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

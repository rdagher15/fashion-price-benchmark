import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/farmers", label: "Farmers" },
  { href: "/admin/buyers", label: "Buyers" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/requirements", label: "Requests" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(user.role === "FARMER" ? "/farmer" : "/buyer");

  return (
    <div className="min-h-dvh pb-8">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">🌾 HarvestLink Admin</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1 text-xs font-semibold">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1.5 text-gray-600 hover:bg-brand-100 hover:text-brand-700">
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="px-4 py-4">{children}</div>
      <div className="px-4"><LogoutButton /></div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

const FARMER_ITEMS: Item[] = [
  { href: "/farmer", label: "Home", icon: "🏠" },
  { href: "/farmer/listings", label: "Listings", icon: "📦" },
  { href: "/farmer/offers", label: "Offers", icon: "🤝" },
  { href: "/farmer/orders", label: "Orders", icon: "🚚" },
  { href: "/farmer/profile", label: "Profile", icon: "👤" },
];

const BUYER_ITEMS: Item[] = [
  { href: "/buyer", label: "Home", icon: "🏠" },
  { href: "/buyer/search", label: "Search", icon: "🔎" },
  { href: "/buyer/requirements", label: "Needs", icon: "📋" },
  { href: "/buyer/orders", label: "Orders", icon: "🚚" },
  { href: "/buyer/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav({ role }: { role: "FARMER" | "BUYER" }) {
  const pathname = usePathname();
  const items = role === "FARMER" ? FARMER_ITEMS : BUYER_ITEMS;

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-gray-200 bg-white">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.href === `/${role.toLowerCase()}` ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-brand-700" : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

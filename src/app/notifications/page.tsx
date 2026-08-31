import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TopBar from "@/components/TopBar";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const homeHref = user.role === "FARMER" ? "/farmer" : user.role === "BUYER" ? "/buyer" : "/admin";

  return (
    <div className="page-scroll">
      <TopBar title="Notifications" backHref={homeHref} />
      <div className="space-y-2 px-4 py-4">
        {notifications.length === 0 && <p className="pt-8 text-center text-sm text-gray-400">No notifications yet.</p>}
        {notifications.map((n) => (
          <Link key={n.id} href={n.link || homeHref} className={`card block ${!n.read ? "border-brand-200 bg-brand-50/40" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">{n.title}</p>
              {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-harvest-500" />}
            </div>
            <p className="text-xs text-gray-500">{n.body}</p>
            <p className="mt-1 text-[11px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

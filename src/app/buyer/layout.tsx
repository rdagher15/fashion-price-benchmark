import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "BUYER") redirect(user.role === "FARMER" ? "/farmer" : "/admin");

  return (
    <div className="page-scroll min-h-dvh">
      {children}
      <BottomNav role="BUYER" />
    </div>
  );
}

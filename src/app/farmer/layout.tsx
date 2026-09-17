import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";

export default async function FarmerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FARMER") redirect(user.role === "BUYER" ? "/buyer" : "/admin");

  return (
    <div className="page-scroll min-h-dvh">
      {children}
      <BottomNav role="FARMER" />
    </div>
  );
}

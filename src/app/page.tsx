import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "FARMER") redirect("/farmer");
    if (user.role === "BUYER") redirect("/buyer");
    if (user.role === "ADMIN") redirect("/admin");
  }

  return (
    <main className="flex min-h-dvh flex-col justify-between px-6 py-10">
      <div>
        <div className="mb-10 flex items-center gap-2">
          <span className="text-3xl">🌾</span>
          <span className="text-xl font-bold text-brand-800">HarvestLink</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-gray-900">
          Fresh produce, matched from farm to buyer.
        </h1>
        <p className="mt-3 text-gray-600">
          List what you grow, or post what you need — HarvestLink matches farmers with retailers,
          restaurants, hotels and institutions, and manages the deal through delivery.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-center text-sm font-semibold text-gray-500">I am a…</p>
        <Link href="/register/farmer" className="btn-primary block">
          🚜 Farmer / Producer
        </Link>
        <Link href="/register/buyer" className="btn-secondary block">
          🏪 Retailer / Buyer
        </Link>
        <p className="pt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

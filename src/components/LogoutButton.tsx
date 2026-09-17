"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="w-full rounded-xl border border-red-200 py-3 text-center text-sm font-semibold text-red-500"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}

import Link from "next/link";

export default function TopBar({
  title,
  subtitle,
  unreadCount = 0,
  backHref,
}: {
  title: string;
  subtitle?: string;
  unreadCount?: number;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cream-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        {backHref && (
          <Link href={backHref} className="text-lg text-gray-500">
            ←
          </Link>
        )}
        <div>
          <h1 className="text-base font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <Link href="/notifications" className="relative text-xl">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-mustard-600 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}

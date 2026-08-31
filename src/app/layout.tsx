import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HarvestLink — Farmer to Retailer Marketplace",
  description: "Connecting fresh-produce farmers with retail, restaurant and institutional buyers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#437c2c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mobile-shell">{children}</div>
      </body>
    </html>
  );
}

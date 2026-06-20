import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ODFE — Odoo Food Experience",
  description:
    "Premium Restaurant & Cafe POS system built on Odoo 19. Manage orders, payments, kitchen display, and more.",
  keywords: [
    "POS",
    "restaurant",
    "cafe",
    "Odoo",
    "food",
    "order management",
    "kitchen display",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950 text-surface-200 antialiased">
        {children}
      </body>
    </html>
  );
}

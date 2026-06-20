import Link from "next/link";
import { HiOutlineHeart } from "react-icons/hi2";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "POS System", href: "/pos" },
    { label: "Kitchen Display", href: "/kitchen" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Support", href: "#" },
    { label: "Status", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "License", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
                <span className="text-sm font-extrabold text-white">O</span>
              </div>
              <span className="text-lg font-bold text-white">ODFE</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-surface-500">
              The premium restaurant management platform built on Odoo 19.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-surface-500 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-surface-600">
            &copy; {new Date().getFullYear()} ODFE. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-surface-600">
            Built with <HiOutlineHeart className="h-3 w-3 text-rose-500" /> on
            Odoo 19
          </p>
        </div>
      </div>
    </footer>
  );
}

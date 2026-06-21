"use client";

import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full animate-fade-up">
      <nav
        className="flex items-center justify-between px-6 py-4 w-[80%]"
        style={{
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.45)",
          boxShadow: "0 20px 60px rgba(40,25,10,0.08)",
          borderRadius: "28px"
        }}
      >
        {/* Logo */}
        <Logo height={32} linked />

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-cafe-text-secondary transition-colors duration-250 hover:text-cafe-text px-2"
          >
            BREW IN
          </Link>
        </div>
      </nav>
    </header>
  );
}

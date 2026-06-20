import Link from "next/link";
import {
  HiOutlineShieldCheck,
  HiOutlineDevicePhoneMobile,
  HiOutlineBolt,
  HiOutlineCubeTransparent,
} from "react-icons/hi2";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-mesh pt-24">
      <div className="absolute inset-0 bg-noise" />

      <div className="pointer-events-none absolute top-20 left-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-1/4 h-80 w-80 rounded-full bg-brand-400/8 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="glass mb-8 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-brand-300">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            Built on Odoo 19 &middot; OWL 2 &middot; WebSocket Realtime
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            The Future of{" "}
            <span className="gradient-text">Restaurant POS</span>
            <br />
            is Here
          </h1>

          <p className="mt-6 max-w-2xl text-base text-surface-400 sm:text-lg md:text-xl">
            ODFE is a premium, full-stack restaurant management platform. From
            point-of-sale to kitchen display, from self-ordering to analytics
            &mdash; everything you need in one beautiful experience.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link href="/dashboard" className="btn-primary flex items-center gap-2 text-base">
              Open Dashboard
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link href="/login" className="btn-secondary text-base">
              Sign In
            </Link>
          </div>

          <div className="mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                icon: HiOutlineBolt,
                label: "Lightning Fast",
                sub: "< 50ms POS",
              },
              {
                icon: HiOutlineShieldCheck,
                label: "Enterprise Security",
                sub: "Role-based access",
              },
              {
                icon: HiOutlineDevicePhoneMobile,
                label: "Self-Order Kiosk",
                sub: "QR menu scanning",
              },
              {
                icon: HiOutlineCubeTransparent,
                label: "Realtime Sync",
                sub: "WebSocket powered",
              },
            ].map((item) => (
              <div key={item.label} className="glass-card flex flex-col items-center p-5">
                <item.icon className="mb-2 h-7 w-7 text-brand-400" />
                <span className="text-sm font-semibold text-white">
                  {item.label}
                </span>
                <span className="mt-1 text-xs text-surface-400">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-950 to-transparent" />
    </section>
  );
}

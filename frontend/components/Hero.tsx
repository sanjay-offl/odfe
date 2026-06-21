import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-16 lg:pt-32 lg:pb-16">
      {/* Subtle warm ambient glow */}
      <div className="pointer-events-none absolute top-32 left-1/4 h-80 w-80 rounded-full bg-cafe-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-32 right-1/3 h-64 w-64 rounded-full bg-cafe-dark/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-[90%] lg:max-w-[85%] w-full">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-10">

          {/* LEFT: Brand Story (55%) */}
          <div className="w-full lg:w-[55%] flex flex-col items-start text-left animate-fade-up">

            {/* Main Heading */}
            <h1 className="text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem] font-display text-cafe-text">
              Run Your Cafe<br />
              <span className="text-cafe-accent">Beautifully.</span>
            </h1>

            {/* Sub Heading */}
            <p className="mt-8 text-lg md:text-xl text-cafe-text font-medium leading-relaxed max-w-2xl">
              Everything your team needs to serve customers faster, manage orders effortlessly, streamline kitchen operations, and grow your business from one beautifully designed platform.
            </p>

            {/* Description */}
            <p className="mt-4 text-base md:text-lg text-cafe-text-secondary leading-relaxed max-w-2xl">
              ODFE brings together Point of Sale, Kitchen Display, Customer Display, QR Ordering, Table Management, Payments, Reporting, and Analytics into one seamless experience built for modern cafes.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="#modules" className="btn-primary flex items-center justify-center gap-2 text-base w-full sm:w-auto !px-8 !py-4 shadow-lg">
                Explore Platform
              </Link>
              <Link href="#demo" className="btn-secondary flex items-center justify-center text-base w-full sm:w-auto !px-8 !py-4">
                Watch Demo
              </Link>
            </div>

            {/* Statistics */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full border-t border-cafe-border pt-8">
              {[
                { value: "500+", label: "Daily Orders" },
                { value: "99.9%", label: "System Uptime" },
                { value: "15+", label: "Integrated Modules" },
                { value: "100%", label: "Real Time Sync" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-2xl font-bold text-cafe-text font-display">{stat.value}</span>
                  <span className="text-xs text-cafe-text-secondary uppercase tracking-wider mt-1">{stat.label}</span>
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT: Embedded Video (45%) */}
          <div className="w-full lg:w-[45%] animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="relative w-full aspect-video rounded-[32px] overflow-hidden p-3"
              style={{
                background: "rgba(255,255,255,0.35)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.45)",
                boxShadow: "0 30px 80px rgba(40,25,10,0.12)",
              }}>
              <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-cafe-bg">
                <iframe
                  className="absolute top-0 left-0 w-full h-full object-cover scale-[1.02]"
                  src="https://www.youtube.com/embed/vA_ptd7F0h4?autoplay=1&mute=1&loop=1&playlist=vA_ptd7F0h4&controls=0&rel=0&modestbranding=1&playsinline=1"
                  title="ODFE Cafe POS Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

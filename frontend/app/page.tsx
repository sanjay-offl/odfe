import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import Link from "next/link";
import {
  LuLayoutGrid,
  LuMonitor,
  LuQrCode,
  LuTableProperties,
  LuCreditCard,
  LuTicket,
  LuChartBar,
  LuCalendar,
  LuChartLine,
  LuSettings,
  LuUsers,
  LuCoffee,
  LuCircleCheck,
  LuChevronRight,
  LuCirclePlay
} from "react-icons/lu";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-cafe-bg font-sans">
      <Navbar />
      
      {/* 1. Hero */}
      <Hero />

      {/* 2. Platform Overview */}
      <section id="overview" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-[85%]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-display text-cafe-text mb-6 leading-tight">
                An artisan approach to <br/>
                <span className="text-cafe-accent text-opacity-80 italic">modern hospitality.</span>
              </h2>
              <p className="text-lg text-cafe-text-secondary leading-relaxed mb-6">
                ODFE strips away the complexity of traditional restaurant software, 
                leaving you with a beautifully minimal, lightning-fast platform that 
                your staff will actually love using.
              </p>
              <p className="text-lg text-cafe-text-secondary leading-relaxed">
                Powered by a robust Odoo 19 backend, our real-time architecture ensures 
                every order, payment, and inventory update happens instantly.
              </p>
            </div>
            <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden glass-panel p-4 animate-fade-up" style={{ animationDelay: "150ms" }}>
              <div className="w-full h-full rounded-[20px] overflow-hidden bg-cafe-surface/30 relative">
                <img 
                  src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
                  alt="Premium Coffee" 
                  className="w-full h-full object-cover mix-blend-multiply opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Modules */}
      <section id="modules" className="relative py-24 bg-cafe-surface/10">
        <div className="mx-auto max-w-[85%]">
          <div className="text-center mb-16 animate-fade-up">
            <span className="inline-block mb-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cafe-accent glass-panel">
              The Ecosystem
            </span>
            <h2 className="text-4xl md:text-5xl font-display text-cafe-text">
              Core Modules
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { title: "Point of Sale", icon: LuLayoutGrid },
              { title: "Kitchen Display", icon: LuMonitor },
              { title: "QR Ordering", icon: LuQrCode },
              { title: "Customer Display", icon: LuMonitor },
              { title: "Table Management", icon: LuTableProperties },
              { title: "Payments", icon: LuCreditCard },
              { title: "Coupons", icon: LuTicket },
              { title: "Reports", icon: LuChartBar },
              { title: "Bookings", icon: LuCalendar },
              { title: "Analytics", icon: LuChartLine },
              { title: "Settings", icon: LuSettings },
              { title: "Employee Management", icon: LuUsers },
            ].map((module, i) => (
              <div key={i} className="glass-card p-8 group hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-cafe-bg/50 flex items-center justify-center mb-5 group-hover:bg-cafe-accent/10 transition-colors">
                  <module.icon className="h-6 w-6 text-cafe-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-display text-cafe-text">{module.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-[85%]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="order-2 lg:order-1 relative aspect-square rounded-[32px] overflow-hidden glass-panel p-4 animate-fade-up">
              <div className="w-full h-full rounded-[20px] overflow-hidden bg-cafe-surface/30">
                <img 
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
                  alt="Cafe Operations" 
                  className="w-full h-full object-cover mix-blend-multiply opacity-80"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 flex flex-col justify-center animate-fade-up">
              <span className="inline-block mb-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cafe-accent w-fit glass-panel">
                Workflow
              </span>
              <h2 className="text-4xl md:text-5xl font-display text-cafe-text mb-10">
                How It Works
              </h2>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Take Orders Seamlessly", desc: "Staff ring up items on the POS or customers scan a QR code at their table." },
                  { step: "02", title: "Instant Kitchen Sync", desc: "Orders instantly appear on the Kitchen Display System without any delay." },
                  { step: "03", title: "Serve & Delight", desc: "Staff are notified when food is ready. Customers receive a premium experience." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 text-3xl font-display text-cafe-accent/40">{item.step}</div>
                    <div>
                      <h3 className="text-xl font-display text-cafe-text mb-2">{item.title}</h3>
                      <p className="text-cafe-text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why Choose ODFE */}
      <section className="relative py-24 bg-cafe-surface/10">
        <div className="mx-auto max-w-[85%] text-center">
          <h2 className="text-4xl md:text-5xl font-display text-cafe-text mb-16">
            Why Choose ODFE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: "Designed for Speed", desc: "A clean, distraction-free interface ensures your staff can process orders in seconds, even during the morning rush." },
              { title: "Reliable Offline Mode", desc: "Keep serving coffee even if the internet drops. ODFE automatically syncs when you're back online." },
              { title: "Enterprise Grade", desc: "Built on Odoo 19, giving you access to world-class inventory management, accounting, and supply chain tools." },
            ].map((item, i) => (
              <div key={i} className="glass-panel p-10 text-left hover:-translate-y-1 transition-transform duration-300">
                <LuCircleCheck className="h-8 w-8 text-cafe-accent mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-display text-cafe-text mb-4">{item.title}</h3>
                <p className="text-cafe-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pricing */}
      <Pricing />

      {/* 7. Customer Experience */}
      <section className="relative py-24 bg-cafe-surface/10">
        <div className="mx-auto max-w-[85%] text-center">
          <LuCoffee className="h-12 w-12 text-cafe-accent mx-auto mb-8" strokeWidth={1} />
          <h2 className="text-4xl md:text-5xl font-display text-cafe-text mb-8 max-w-4xl mx-auto leading-tight">
            "ODFE completely transformed our morning service. The speed, the aesthetic, and the reliability are unmatched in the industry."
          </h2>
          <p className="text-lg text-cafe-accent font-medium tracking-wide uppercase">
            — The Artisan Roastery
          </p>
        </div>
      </section>

      {/* 8. CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-cafe-dark" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        
        <div className="relative z-10 mx-auto max-w-4xl text-center px-6">
          <h2 className="text-5xl md:text-6xl font-display text-cafe-bg mb-8">
            The Standard for Premium Coffee.
          </h2>
          <p className="text-xl text-cafe-bg/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Crafted for the artisans. Experience the harmony of design and powerful POS operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login" className="btn-primary !bg-cafe-bg !text-cafe-dark hover:!bg-white !px-10 !py-4 text-lg">
              Explore the Interface
            </Link>
          </div>
        </div>
      </section>



      {/* 9. Footer */}
      <footer className="bg-cafe-bg py-12 border-t border-cafe-border">
        <div className="mx-auto max-w-[85%] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-8 w-20">
              <img src="/light_logo.jpeg" alt="ODFE" className="h-8 w-auto mix-blend-multiply scale-[3] pointer-events-none" draggable={false} />
            </div>
            <span className="text-cafe-text-secondary text-sm">© 2026 ODFE. All rights reserved.</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-cafe-text-secondary">
            <Link href="#" className="hover:text-cafe-text transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-cafe-text transition-colors">Terms</Link>
            <Link href="#" className="hover:text-cafe-text transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

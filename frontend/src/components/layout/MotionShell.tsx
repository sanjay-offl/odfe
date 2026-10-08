import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useLocation, useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BarChart3, ChefHat, CreditCard, Grid2X2, LogOut, Menu, Package, Settings2, ShoppingBag, Tag, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, roleLabel } from '../../store';
import { Page } from '../ui/Page';

const sidebarVariants: Variants = {
  closed: { x: '-100%', opacity: 0.98 },
  open: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 320, damping: 28 }
  },
  exit: {
    x: '-100%',
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] }
  }
};

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } }
};

const navItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.05 + i * 0.04, duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }
  })
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] } }
};

export function MotionShell() {
  const user = useAuth((s) => s.user)!;
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const links =
    user.role === 'ADMIN'
      ? ([
          ['/admin/products', 'Products', Package],
          ['/admin/categories', 'Categories', Grid2X2],
          ['/admin/payments', 'Payments', CreditCard],
          ['/admin/promotions', 'Promotions', Tag],
          ['/admin/booking', 'Booking', Settings2],
          ['/admin/users', 'Team', Users],
          ['/admin/reports', 'Reports', BarChart3],
          ['/kds', 'Kitchen display', ChefHat]
        ] as const)
      : ([
          ['/pos', 'POS terminal', ShoppingBag],
          ['/kds', 'Kitchen display', ChefHat]
        ] as const);

  const isPos = location.pathname.startsWith('/pos');
  const title = isPos ? 'POS terminal' : 'Workspace';
  const firstName = user.name?.split(' ')[0] || 'Team';

  return (
    <div className="app-shell">
      <AnimatePresence>
        {open && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[4] bg-black/40 backdrop-blur-[1px] md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar ${open ? 'open' : ''}`}
        initial={false}
        animate={open ? 'open' : 'closed'}
        variants={sidebarVariants}
        style={{ transformOrigin: 'left' }}
      >
        <div className="brand">
          <motion.span
            className="brand-mark"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
          >
            <img src="/light_logo.jpeg" alt="ODFE" />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            ODFE<small>cafe operations</small>
          </motion.span>
        </div>

        <nav>
          {links.map(([to, label, Icon], i) => (
            <motion.div
              key={to}
              custom={i}
              variants={navItem}
              initial="hidden"
              animate="visible"
            >
              <NavLink
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? 'active group' : 'group')}
              >
                <Icon size={19} />
                {label}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <motion.button
          className="logout"
          onClick={() => {
            logout();
            toast.success('See you next time');
          }}
          whileHover={{ backgroundColor: '#4a2e22' }}
          whileTap={{ scale: 0.995 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        >
          <LogOut size={18} />
          Log out
        </motion.button>
      </motion.aside>

      <main className="main">
        <motion.header
          className="topbar"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)}>
            <Menu size={22} />
          </button>
          <div>
            <span className="eyebrow">Good morning, {firstName}</span>
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {title}
            </motion.h1>
          </div>
          <div className="top-actions">
            <motion.span
              className="status-dot"
              animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0 4px #e2eee3', '0 0 0 5px #f0f7f0', '0 0 0 4px #e2eee3'] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            />
            <span className="hide-mobile">Online</span>
            <motion.div
              className="avatar"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
            >
              {user.name?.[0]?.toUpperCase() || 'U'}
            </motion.div>
          </div>
        </motion.header>

        <Page>
          <Outlet />
        </Page>
      </main>
    </div>
  );
}

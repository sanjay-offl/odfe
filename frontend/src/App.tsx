import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BarChart3, ChefHat, ChevronDown, Coffee, Grid2X2, LogOut, Menu, Monitor, Package, Plus, Search, Settings2, ShoppingBag, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { categories, products } from './data';
import { useAuth, usePos, roleLabel } from './store';
import { money, readableText } from './utils';
import type { Product } from './types';

export function Protected() { return useAuth.getState().user ? <Outlet /> : <Navigate to="/login" replace />; }
function Shell() {
  const user = useAuth((s) => s.user)!; const logout = useAuth((s) => s.logout); const [open, setOpen] = useState(false);
  const links = user.role === 'ADMIN' ? [['/admin/products', 'Products', Package], ['/admin/categories', 'Categories', Grid2X2], ['/admin/booking', 'Booking', Settings2], ['/admin/users', 'Team', Users], ['/admin/reports', 'Reports', BarChart3], ['/kds', 'Kitchen display', ChefHat]] as const : [['/pos', 'POS terminal', ShoppingBag], ['/kds', 'Kitchen display', ChefHat]] as const;
  return <div className="app-shell"><aside className={open ? 'sidebar open' : 'sidebar'}><div className="brand"><span className="brand-mark">O</span><span>ODFE<small>cafe operations</small></span></div><nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={19}/>{label}</NavLink>)}</nav><button className="logout" onClick={() => { logout(); toast.success('See you next time'); }}><LogOut size={18}/>Log out</button></aside><main className="main"><header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setOpen(!open)}><Menu size={22}/></button><div><span className="eyebrow">Good morning, {user.name.split(' ')[0]}</span><h1>{useLocation().pathname.startsWith('/pos') ? 'POS terminal' : 'Workspace'}</h1></div><div className="top-actions"><span className="status-dot"/> <span className="hide-mobile">Online</span><div className="avatar">{user.name[0]}</div></div></header><Outlet /></main></div>;
}
export function Auth({ signup = false }: { signup?: boolean }) {
  const login = useAuth((s) => s.login); const navigate = useNavigate(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (signup && (!name || password.length < 8)))
      return toast.error(signup ? 'Complete the form with a password of 8+ characters.' : 'Enter your email and password.');
    login({ name: name || 'Alex Morgan', email, role: email.includes('admin') ? 'ADMIN' : 'EMPLOYEE' });
    sessionStorage.setItem('odfe-token', 'demo-token');
    navigate('/pos');
    toast.success('Welcome to ODFE');
  };
  return (
    <div className="auth-page">
      <motion.div
        className="auth-art"
        initial={{ x: -20, opacity: 0, filter: 'blur(4px)' }}
        animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="brand light">
          <motion.span
            className="brand-mark"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.05 }}
          >
            O
          </motion.span>
          <span>
            ODFE<small>cafe operations</small>
          </span>
        </div>
        <motion.div
          className="art-copy"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.22 }}
        >
          <p className="eyebrow">Your cafe, in rhythm</p>
          <h1>
            Make every
            <br />
            <em>moment</em> count.
          </h1>
          <p>A calmer, warmer way to run your floor, bar and kitchen.</p>
        </motion.div>
        <motion.div
          className="art-foot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          Designed for the places people love to return to.
        </motion.div>
      </motion.div>
      <motion.div
        className="auth-form"
        initial={{ x: 20, opacity: 0, filter: 'blur(4px)' }}
        animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="mobile-brand brand">
          <span className="brand-mark">O</span>
          <span>
            ODFE<small>cafe operations</small>
          </span>
        </div>
        <motion.div
          className="form-wrap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.2 }}
        >
          <p className="eyebrow">{signup ? 'Create your workspace' : 'Welcome back'}</p>
          <h2>{signup ? 'Start serving better.' : 'Good to see you again.'}</h2>
          <p className="muted">{signup ? 'Set up your cafe account in a minute.' : 'Sign in to pick up where you left off.'}</p>
          <form onSubmit={submit}>
            {signup && (
              <motion.label
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                Name
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alex Morgan"
                />
              </motion.label>
            )}
            <motion.label
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: signup ? 0.1 : 0.08 }}
            >
              Email
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@cafe.com"
              />
            </motion.label>
            <motion.label
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: signup ? 0.12 : 0.1 }}
            >
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={signup ? 'At least 8 characters' : '••••••••'}
              />
            </motion.label>
            <motion.button
              className="primary full"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.995 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26, delay: signup ? 0.14 : 0.12 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {signup ? 'Create account' : 'Sign in'} <span>→</span>
            </motion.button>
          </form>
          <motion.p
            className="switch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: signup ? 0.16 : 0.14 }}
          >
            {signup ? 'Already have an account?' : 'New to ODFE?'}{' '}
            <NavLink to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</NavLink>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
export function Pos() {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('All'); const add = usePos(s => s.add); const cart = usePos(s => s.cart); const change = usePos(s => s.change);
  const visible = products.filter(p => (category === 'All' || p.category.name === category) && p.name.toLowerCase().includes(query.toLowerCase())); const subtotal = cart.reduce((a, l) => a + l.product.price * l.quantity, 0);
  return <section className="pos-page"><div className="pos-toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search menu..." /></div><button className="secondary"><Grid2X2 size={17}/> Table 12 <ChevronDown size={16}/></button></div><div className="pos-grid"><div className="menu-area"><div className="category-tabs">{['All', ...categories.map(c => c.name)].map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="product-grid">{visible.map(p => <button className="product-card" key={p.id} onClick={() => { add(p); toast.success(`${p.name} added`, { id: p.id }); }}><span className="product-accent" style={{ background: p.category.color }}/><div className="product-icon" style={{ background: p.category.color, color: readableText(p.category.color) }}>{p.name[0]}</div><div className="product-info"><strong>{p.name}</strong><span>{p.description}</span><b>{money(p.price)}</b></div><span className="add"><Plus size={18}/></span></button>)}</div></div><aside className="cart"><div className="cart-head"><div><p className="eyebrow">Current order</p><h2>Table 12</h2></div><span className="count">{cart.reduce((a, l) => a + l.quantity, 0)} items</span></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={30}/><strong>Your order is empty</strong><span>Tap a menu item to get started</span></div> : <div className="cart-lines">{cart.map(l => <div className="cart-line" key={l.product.id}><div><strong>{l.product.name}</strong><span>{money(l.product.price)} each</span></div><div className="qty"><button onClick={() => change(l.product.id, l.quantity - 1)}>−</button><b>{l.quantity}</b><button onClick={() => change(l.product.id, l.quantity + 1)}>+</button></div><strong>{money(l.product.price * l.quantity)}</strong></div>)}</div>}<div className="totals"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Tax <small>8.5%</small></span><b>{money(subtotal * .085)}</b></div><div className="total"><strong>Total</strong><strong>{money(subtotal * 1.085)}</strong></div><button className="primary full" disabled={!cart.length} onClick={() => { toast.success('Order sent to payment'); }}>Charge {money(subtotal * 1.085)} <span>→</span></button></div></aside></div></section>;
}
export function AdminPage({ title, subtitle, kind = 'table' }: { title: string; subtitle: string; kind?: string }) {
  const [search, setSearch] = useState('');
  const categoryRows = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const productRows = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return <section className="content"><div className="page-heading"><div><p className="eyebrow">Manage</p><h2>{title}</h2><p className="muted">{subtitle}</p></div><button className="primary"><Plus size={18}/> Add {title.slice(0, -1)}</button></div><div className="panel"><div className="panel-toolbar"><div className="search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}...`}/></div><span className="result-count">{kind === 'categories' ? categoryRows.length : kind === 'products' ? productRows.length : 0} results</span></div>{kind === 'categories' ? <div className="category-list">{categoryRows.map(c => <div className="category-row" key={c.id}><span className="swatch" style={{ background: c.color }}/><strong>{c.name}</strong><span className="muted">Color {c.color}</span><button className="text-btn">Edit</button></div>)}</div> : kind === 'products' ? <div className="data-table"><div className="tr th"><span>Product</span><span>Category</span><span>Price</span><span>Kitchen</span><span/></div>{productRows.map((p: Product) => <div className="tr" key={p.id}><span className="product-cell"><span className="mini-dot" style={{ background: p.category.color }}/><strong>{p.name}</strong></span><span className="muted">{p.category.name}</span><span className="price">{money(p.price)}</span><span><span className="pill green">{p.sendToKitchen ? 'Yes' : 'No'}</span></span><button className="text-btn">Edit</button></div>)}</div> : <div className="empty-state"><Settings2 size={28}/><strong>{title} is ready to configure</strong><span>Connect this workspace to your cafe settings when you are ready.</span></div>}</div></section>;
}
import { AnimatePresence, motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from './components/ui/Stagger';

export function Kds() {
  const [stage, setStage] = useState('New');
  const tickets = [{ id: '1048', table: 'Table 12', time: '2 min ago', items: [{ q: 2, n: 'Cappuccino' }, { q: 1, n: 'Avocado Toast' }] }];
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Live service</p>
          <h2>Kitchen display</h2>
          <p className="muted">Keep the pass moving. Updated just now.</p>
        </div>
        <motion.span
          className="live"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          <motion.span
            className="status-dot"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          />
          Live
        </motion.span>
      </div>
      <div className="kds-columns">
        {['New', 'Preparing', 'Ready'].map(column => (
          <motion.div
            key={column}
            className="kds-column"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="column-title">
              <strong>{column}</strong>
              <span>1</span>
            </div>
            <StaggerContainer>
              {tickets.map(t => (
                <StaggerItem key={t.id}>
                  <motion.div
                    layout
                    className="order-ticket"
                    initial={{ opacity: 0, scale: 0.98, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -6 }}
                    whileHover={{ y: -1, boxShadow: '0 10px 22px rgba(58,31,10,0.12)' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  >
                    <div className="ticket-head">
                      <strong>#{t.id}</strong>
                      <span>{t.time}</span>
                    </div>
                    <h3>{t.table}</h3>
                    {t.items.map((it, i) => (
                      <div className="ticket-item" key={i}>
                        <b>{it.q}×</b>
                        <span>{it.n}</span>
                      </div>
                    ))}
                    <motion.button
                      className="secondary full"
                      onClick={() => setStage(column === 'New' ? 'Preparing' : 'Ready')}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.995 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                    >
                      {stage === column ? 'Move to next stage →' : `Mark ${column === 'New' ? 'preparing' : 'ready'}`}
                    </motion.button>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
export function Display({ selfOrder = false }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="display-page">
      <div className="display-top">
        <div className="brand light">
          <span className="brand-mark">O</span>
          <span>
            ODFE<small>cafe operations</small>
          </span>
        </div>
        <span>{selfOrder ? 'Order at your table' : 'Thank you for visiting'}</span>
      </div>
      <motion.div
        className="display-content"
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {sent ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22 }}
            >
              <motion.div
                className="success-mark"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.08 }}
              >
                ✓
              </motion.div>
              <h1>Order received.</h1>
              <p>Your order is now with the kitchen. We’ll bring it right over.</p>
              <motion.button
                className="primary"
                onClick={() => setSent(false)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.995 }}
              >
                Start another order
              </motion.button>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <p className="eyebrow">Welcome to our cafe</p>
            <h1>
              Good food.
              <br />
              <em>Good company.</em>
            </h1>
            <p>
              {selfOrder
                ? 'Browse the menu and order from your table.'
                : 'Your order number will appear here when it is ready.'}
            </p>
            {selfOrder && (
              <motion.button
                className="primary"
                onClick={() => setSent(true)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.995 }}
              >
                Browse menu <span>→</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
import { AnimatedRoutes } from './components/layout/AnimatedRoutes';

function App() {
  return <AnimatedRoutes />;
}
export default App;

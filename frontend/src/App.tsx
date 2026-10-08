import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BarChart3, Banknote, ChefHat, ChevronDown, CreditCard, Grid2X2, LogOut, Menu, Package, Plus, QrCode, Search, Settings2, ShoppingBag, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { categories, products } from './data';
import { useAuth, usePos } from './store';
import { money, readableText } from './utils';
import type { Product } from './types';

export function Protected() { return useAuth.getState().user ? <Outlet /> : <Navigate to="/login" replace />; }
function Shell() {
  const user = useAuth((s) => s.user)!; const logout = useAuth((s) => s.logout); const [open, setOpen] = useState(false);
  const links = user.role === 'ADMIN' ? [['/admin/products', 'Products', Package], ['/admin/categories', 'Categories', Grid2X2], ['/admin/booking', 'Booking', Settings2], ['/admin/users', 'Team', Users], ['/admin/reports', 'Reports', BarChart3], ['/kds', 'Kitchen display', ChefHat]] as const : [['/pos', 'POS terminal', ShoppingBag], ['/kds', 'Kitchen display', ChefHat]] as const;
  return <div className="app-shell"><aside className={open ? 'sidebar open' : 'sidebar'}><div className="brand"><img className="brand-logo" src="/light_logo.jpeg" alt="ODFE" /><span>ODFE<small>cafe operations</small></span></div><nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={19}/>{label}</NavLink>)}</nav><button className="logout" onClick={() => { logout(); toast.success('See you next time'); }}><LogOut size={18}/>Log out</button></aside><main className="main"><header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setOpen(!open)}><Menu size={22}/></button><div><span className="eyebrow">Good morning, {user.name.split(' ')[0]}</span><h1>{useLocation().pathname.startsWith('/pos') ? 'POS terminal' : 'Workspace'}</h1></div><div className="top-actions"><span className="status-dot"/> <span className="hide-mobile">Online</span><div className="avatar">{user.name[0]}</div></div></header><Outlet /></main></div>;
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
            <img src="/light_logo.jpeg" alt="ODFE" />
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
          <img className="brand-logo" src="/light_logo.jpeg" alt="ODFE" />
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
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [table, setTable] = useState(12);
  const [showTables, setShowTables] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card / Digital' | 'UPI QR'>('Cash');
  const [paid, setPaid] = useState(false);
  const add = usePos(s => s.add);
  const cart = usePos(s => s.cart);
  const change = usePos(s => s.change);
  const visible = products.filter(
    p => (category === 'All' || p.category.name === category) && p.name.toLowerCase().includes(query.toLowerCase())
  );
  const subtotal = cart.reduce((a, l) => a + l.product.price * l.quantity, 0);
  const tax = subtotal * 0.085;
  const total = subtotal + tax;
  return (
    <section className="pos-page">
      <div className="pos-toolbar">
        <motion.div className="search" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <Search size={18} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search menu..." />
        </motion.div>
        <motion.button
          className="secondary"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.995 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.03 }}
          onClick={() => setShowTables(true)}
        >
          <Grid2X2 size={17} /> Table {table} <ChevronDown size={16} />
        </motion.button>
      </div>
      <div className="pos-grid">
        <div className="menu-area">
          <motion.div className="category-tabs" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
            {['All', ...categories.map(c => c.name)].map((c, i) => (
              <motion.button
                key={c}
                className={category === c ? 'selected' : ''}
                onClick={() => setCategory(c)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              >
                {c}
              </motion.button>
            ))}
          </motion.div>
          <StaggerContainer>
            <div className="product-grid">
              {visible.map(p => (
                <StaggerItem key={p.id}>
                  <motion.button
                    className="product-card"
                    layout
                    whileHover={{ y: -4, boxShadow: '0 14px 32px rgba(58,31,10,0.16)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    onClick={() => {
                      add(p);
                      toast.success(`${p.name} added`, { id: p.id });
                    }}
                  >
                    <span className="product-accent" style={{ background: p.category.color }} />
                    <motion.div className="product-icon" style={{ background: p.category.color, color: readableText(p.category.color) }} whileHover={{ rotate: 2 }}>
                      {p.name[0]}
                    </motion.div>
                    <div className="product-info">
                      <strong>{p.name}</strong>
                      <span>{p.description}</span>
                      <b>{money(p.price)}</b>
                    </div>
                    <motion.span className="add" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                      <Plus size={18} />
                    </motion.span>
                  </motion.button>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
        <motion.aside className="cart" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
          <div className="cart-head">
            <div>
              <p className="eyebrow">Current order</p>
              <h2>Table {table}</h2>
            </div>
            <motion.span
              className="count"
              key={cart.reduce((a, l) => a + l.quantity, 0)}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            >
              {cart.reduce((a, l) => a + l.quantity, 0)} items
            </motion.span>
          </div>
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div key="empty" className="empty-cart" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
                <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}>
                  <ShoppingBag size={30} />
                </motion.div>
                <strong>Your order is empty</strong>
                <span>Tap a menu item to get started</span>
              </motion.div>
            ) : (
              <motion.div key="lines" className="cart-lines">
                <StaggerContainer>
                  {cart.map(l => (
                    <StaggerItem key={l.product.id}>
                      <motion.div
                        layout
                        className="cart-line"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 8, scale: 0.98 }}
                        whileHover={{ background: '#faf7f2', borderRadius: 10, paddingLeft: 8, paddingRight: 8 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                      >
                        <div>
                          <strong>{l.product.name}</strong>
                          <span>{money(l.product.price)} each</span>
                        </div>
                        <div className="qty">
                          <motion.button onClick={() => change(l.product.id, l.quantity - 1)} whileHover={{ background: '#f0e7df' }} whileTap={{ scale: 0.9 }}>
                            −
                          </motion.button>
                          <motion.b key={l.quantity} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }}>
                            {l.quantity}
                          </motion.b>
                          <motion.button onClick={() => change(l.product.id, l.quantity + 1)} whileHover={{ background: '#f0e7df' }} whileTap={{ scale: 0.9 }}>
                            +
                          </motion.button>
                        </div>
                        <motion.strong key={l.product.price * l.quantity} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
                          {money(l.product.price * l.quantity)}
                        </motion.strong>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="totals">
            <div>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div>
              <span>Tax <small>(8.5%)</small></span>
              <b>{money(tax)}</b>
            </div>
            <div className="total">
              <span>Total</span>
              <motion.b key={total} initial={{ scale: 1.05, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                {money(total)}
              </motion.b>
            </div>
            <motion.button className="primary full" whileHover={{ y: -1 }} whileTap={{ scale: 0.995 }} transition={{ type: 'spring', stiffness: 360, damping: 26 }} disabled={!cart.length} onClick={() => setShowPayment(true)}>
              Charge {money(total)} <span>→</span>
            </motion.button>
            <motion.button className="secondary full" whileHover={{ y: -1 }} whileTap={{ scale: 0.995 }} transition={{ type: 'spring', stiffness: 360, damping: 26 }} style={{ marginTop: 8 }} onClick={() => usePos.getState().clear()} disabled={!cart.length}>
              Clear
            </motion.button>
          </div>
        </motion.aside>
      </div>
      {showTables && (
        <div className="modal-backdrop" onClick={() => setShowTables(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><div><p className="eyebrow">Floor plan</p><h2>Choose a table</h2></div><button className="icon-btn" onClick={() => setShowTables(false)}><X size={19} /></button></div>
            <p className="muted">Main floor · available tables</p>
            <div className="table-grid">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(number => {
                const occupied = [3, 7, 12].includes(number);
                return <button key={number} className={`floor-table ${number === table ? 'selected' : ''} ${occupied ? 'occupied' : ''}`} disabled={occupied} onClick={() => { setTable(number); setShowTables(false); toast.success(`Table ${number} selected`); }}><strong>{number}</strong><span>{occupied ? 'In service' : `${number % 3 + 2} seats`}</span></button>;
              })}
            </div>
          </div>
        </div>
      )}
      {showPayment && (
        <div className="modal-backdrop" onClick={() => setShowPayment(false)}>
          <div className="modal payment-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><div><p className="eyebrow">Checkout · Table {table}</p><h2>{paid ? 'Payment complete' : 'Take payment'}</h2></div><button className="icon-btn" onClick={() => setShowPayment(false)}><X size={19} /></button></div>
            {paid ? <div className="payment-success"><div className="success-mark">✓</div><h3>Order sent to kitchen</h3><p className="muted">Receipt #1048 is ready to print or email.</p><button className="primary full" onClick={() => { setPaid(false); setShowPayment(false); usePos.getState().clear(); }}>New order</button></div> : <>
              <div className="checkout-total"><span>Amount due</span><strong>{money(total)}</strong></div>
              <div className="payment-options">{([['Cash', Banknote], ['Card / Digital', CreditCard], ['UPI QR', QrCode]] as const).map(([method, Icon]) => <button key={method} className={paymentMethod === method ? 'payment-option selected' : 'payment-option'} onClick={() => setPaymentMethod(method)}><Icon size={20} /><span>{method}</span></button>)}</div>
              {paymentMethod === 'UPI QR' && <div className="upi-code"><QrCode size={86} /><div><strong>Scan to pay</strong><span>odfe.cafe@ybl</span></div></div>}
              <button className="primary full" onClick={() => { setPaid(true); toast.success('Payment recorded'); }}>Confirm {paymentMethod} · {money(total)}</button>
            </>}
          </div>
        </div>
      )}
    </section>
  );
}
export function AdminPage({ title, subtitle, kind = 'table' }: { title: string; subtitle: string; kind?: string }) {
  const [search, setSearch] = useState('');
  const categoryRows = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const productRows = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Manage</p>
          <motion.h2
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {title}
          </motion.h2>
          <p className="muted">{subtitle}</p>
        </div>
        <motion.button
          className="primary"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.995 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Plus size={18} /> Add {title.slice(0, -1)}
        </motion.button>
      </div>
      <motion.div
        className="panel"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="panel-toolbar">
          <motion.div
            className="search"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
          >
            <Search size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
            />
          </motion.div>
          <motion.span
            className="result-count"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06 }}
          >
            {kind === 'categories' ? categoryRows.length : kind === 'products' ? productRows.length : 0} results
          </motion.span>
        </div>
        {kind === 'categories' ? (
          <div className="category-list">
            <StaggerContainer>
              {categoryRows.map(c => (
                <StaggerItem key={c.id}>
                  <motion.div
                    className="category-row"
                    whileHover={{ background: '#faf7f2', borderRadius: 10, paddingLeft: 8, paddingRight: 8 }}
                    transition={{ duration: 0.16 }}
                  >
                    <span className="swatch" style={{ background: c.color }} />
                    <strong>{c.name}</strong>
                    <span className="muted">Color {c.color}</span>
                    <motion.button className="text-btn" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                      Edit
                    </motion.button>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        ) : kind === 'products' ? (
          <div className="data-table">
            <div className="tr th">
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Kitchen</span>
              <span />
            </div>
            <StaggerContainer>
              {productRows.map((p: Product) => (
                <StaggerItem key={p.id}>
                  <motion.div
                    className="tr"
                    whileHover={{ background: '#faf7f2', borderRadius: 10, paddingLeft: 12, paddingRight: 12 }}
                    transition={{ duration: 0.16 }}
                  >
                    <span className="product-cell">
                      <motion.span
                        className="mini-dot"
                        style={{ background: p.category.color }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 18 }}
                      />
                      <strong>{p.name}</strong>
                    </span>
                    <span className="muted">{p.category.name}</span>
                    <span className="price">{money(p.price)}</span>
                    <span>
                      <span className="pill green">{p.sendToKitchen ? 'Yes' : 'No'}</span>
                    </span>
                    <motion.button className="text-btn" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                      Edit
                    </motion.button>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        ) : (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
          >
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            >
              <Settings2 size={28} />
            </motion.div>
            <strong>{title} is ready to configure</strong>
            <span>Connect this workspace to your cafe settings when you are ready.</span>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
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
          <img className="brand-logo" src="/light_logo.jpeg" alt="ODFE" />
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

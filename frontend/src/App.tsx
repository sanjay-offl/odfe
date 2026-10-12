import type { ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './store/auth';
import { useSettings } from './hooks/useSettings';
import { roleHas, type Permission } from './lib/permissions';
import { AppShell } from './components/layout/AppShell';
import { landingPathFor } from './components/layout/nav';
import { Button } from './components/ui/primitives';
import { LoginPage } from './pages/LoginPage';
import { CustomerDisplayPage } from './pages/CustomerDisplayPage';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { OrdersPage } from './pages/OrdersPage';
import { KitchenPage } from './pages/KitchenPage';
import { TablesPage } from './pages/TablesPage';
import { MenuPage } from './pages/MenuPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CustomersPage } from './pages/CustomersPage';
import { InventoryPage } from './pages/InventoryPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Keeps the money formatter + document title in sync with persisted settings on every screen. */
function SettingsSync() {
  useSettings();
  return null;
}

/** Gate for authenticated areas: bounces to /login and remembers where the user was headed. */
function Protected() {
  const user = useAuth((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** The user's natural home for their role, used by "/" and the access-denied screen. */
function IndexRedirect() {
  const user = useAuth((s) => s.user);
  return <Navigate to={user ? landingPathFor(user.role) : '/login'} replace />;
}

function AccessDenied() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const home = user ? landingPathFor(user.role) : '/login';
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-16 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sand text-caramel">
          <ShieldAlert size={26} />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-roast">You don&apos;t have access to this area</h1>
        <p className="mt-2 text-sm text-muted">
          Your role ({user?.role.toLowerCase() ?? 'guest'}) doesn&apos;t include this permission. Ask an admin if you
          think this is a mistake.
        </p>
        <Button className="mt-6" onClick={() => navigate(home, { replace: true })}>
          Back to my workspace
        </Button>
      </div>
    </div>
  );
}

/** Route-level RBAC. Pages additionally hide per-action controls so the UI stays coherent. */
function RequirePermission({ permission, children }: { permission: Permission; children: ReactElement }) {
  const role = useAuth((s) => s.user?.role);
  if (!roleHas(role, permission)) return <AccessDenied />;
  return children;
}

export default function App() {
  return (
    <>
      <SettingsSync />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Public, unauthenticated surface used as a second-screen customer display. */}
        <Route path="/customer-display" element={<CustomerDisplayPage />} />

        <Route element={<Protected />}>
          <Route element={<AppShell />}>
            <Route index element={<IndexRedirect />} />
            <Route path="dashboard" element={<RequirePermission permission="orders.view"><DashboardPage /></RequirePermission>} />
            <Route path="pos" element={<RequirePermission permission="pos.use"><PosPage /></RequirePermission>} />
            <Route path="orders" element={<RequirePermission permission="orders.view"><OrdersPage /></RequirePermission>} />
            <Route path="kitchen" element={<RequirePermission permission="kitchen.view"><KitchenPage /></RequirePermission>} />
            <Route path="tables" element={<RequirePermission permission="tables.view"><TablesPage /></RequirePermission>} />
            <Route path="menu" element={<RequirePermission permission="menu.view"><MenuPage /></RequirePermission>} />
            <Route path="categories" element={<RequirePermission permission="menu.view"><CategoriesPage /></RequirePermission>} />
            <Route path="customers" element={<RequirePermission permission="customers.view"><CustomersPage /></RequirePermission>} />
            <Route path="inventory" element={<RequirePermission permission="inventory.view"><InventoryPage /></RequirePermission>} />
            <Route path="employees" element={<RequirePermission permission="employees.view"><EmployeesPage /></RequirePermission>} />
            <Route path="reports" element={<RequirePermission permission="reports.view"><ReportsPage /></RequirePermission>} />
            <Route path="settings" element={<RequirePermission permission="settings.manage"><SettingsPage /></RequirePermission>} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

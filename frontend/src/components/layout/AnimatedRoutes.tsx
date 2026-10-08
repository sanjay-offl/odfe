import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store';
import { MotionShell } from './MotionShell';
import { Page } from '../ui/Page';

import { Auth, Pos, Kds, Display, AdminPage, Protected } from '../../App';

function AdminSection() {
  const { section = 'workspace' } = useParams();
  const config: Record<string, [string, string, string]> = {
    booking: ['Booking', 'Manage floor reservations and table availability.', 'booking'],
    users: ['Team', 'Manage admins, cashiers, and account access.', 'users'],
    reports: ['Reports', 'Real-time sales insights for your cafe.', 'reports'],
    payments: ['Payment methods', 'Enable the ways your customers pay.', 'payments'],
    promotions: ['Coupons & promotions', 'Create discounts that help guests come back.', 'promotions']
  };
  const [title, subtitle, kind] = config[section] || ['Workspace', 'Everything your team needs, in one place.', 'workspace'];
  return <Page><AdminPage title={title} subtitle={subtitle} kind={kind} /></Page>;
}

export function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    const fn = () => {
      useAuth.getState().logout();
      window.location.href = '/login';
    };
    window.addEventListener('odfe:unauthorized', fn);
    return () => window.removeEventListener('odfe:unauthorized', fn);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <Page>
              <Auth />
            </Page>
          }
        />
        <Route
          path="/signup"
          element={
            <Page>
              <Auth signup />
            </Page>
          }
        />
        <Route element={<Protected />}>
          <Route element={<MotionShell />}>
            <Route
              path="/pos"
              element={
                <Page>
                  <Pos />
                </Page>
              }
            />
            <Route
              path="/pos/*"
              element={
                <Page>
                  <Pos />
                </Page>
              }
            />
            <Route
              path="/admin/products"
              element={
                <Page>
                  <AdminPage
                    title="Products"
                    subtitle="Your menu, priced and ready to sell."
                    kind="products"
                  />
                </Page>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <Page>
                  <AdminPage
                    title="Categories"
                    subtitle="Organise your menu with a little colour."
                    kind="categories"
                  />
                </Page>
              }
            />
            <Route path="/admin/:section" element={<AdminSection />} />
            <Route
              path="/kds"
              element={
                <Page>
                  <Kds />
                </Page>
              }
            />
          </Route>
        </Route>
        <Route
          path="/customer-display"
          element={
            <Page>
              <Display />
            </Page>
          }
        />
        <Route
          path="/s/:token"
          element={
            <Page>
              <Display selfOrder />
            </Page>
          }
        />
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store';
import { MotionShell } from './MotionShell';
import { Page } from '../ui/Page';

import { Auth, Pos, Kds, Display, AdminPage, Protected } from '../../App';

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
            <Route
              path="/admin/:section"
              element={
                <Page>
                  <AdminPage
                    title="Workspace"
                    subtitle="Everything your team needs, in one place."
                  />
                </Page>
              }
            />
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

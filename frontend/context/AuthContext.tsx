"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import Logo from '@/components/Logo';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  isActive?: boolean;
  cafeName?: string;
  employeeId?: string;
  shift?: string;
  department?: string;
  [key: string]: any;
}

interface AuthContextType {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  session: null,
  user: null,
  profile: null,
  role: null,
  isAuthenticated: false,
  logout: async () => {},
  refreshProfile: async () => {},
});

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E8E3D3]">
      <div className="flex flex-col items-center gap-6">
        <Logo height={48} linked={false} />
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#B43C1E] border-t-transparent" />
      </div>
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// ─── Cookie helpers ────────────────────────────────────────────────────────────
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ─── Role → target route ───────────────────────────────────────────────────────
function getRoleHome(role: string, dept?: string | null): string {
  if (role === 'ADMIN') return '/dashboard';
  if (role === 'EMPLOYEE') {
    const d = (dept || '').toLowerCase();
    if (d === 'kitchen') return '/kitchen';
    if (d === 'orders') return '/orders';
    if (d === 'billing') return '/payments';
    return '/pos';
  }
  return '/self-order';
}

// ─── Public / Protected page lists ────────────────────────────────────────────
const ALWAYS_PUBLIC = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];
const ALWAYS_PUBLIC_PREFIXES = ['/self-order', '/s/', '/customer-display', '/forbidden'];

const ADMIN_ROUTES = [
  '/dashboard', '/products', '/categories', '/employees',
  '/coupons', '/promotions', '/bookings', '/reports',
  '/settings', '/payment-methods', '/floors', '/tables', '/profile',
];

const EMPLOYEE_ROUTES: Record<string, string[]> = {
  cashier: ['/pos', '/orders', '/customers', '/tables', '/payments', '/profile'],
  orders:  ['/pos', '/orders', '/customers', '/tables', '/payments', '/profile'],
  kitchen: ['/kitchen', '/profile'],
  billing: ['/payments', '/customer-display', '/profile'],
};

function isRouteAllowed(pathname: string, role: string, dept?: string | null): boolean {
  if (ALWAYS_PUBLIC.includes(pathname)) return true;
  if (ALWAYS_PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return true;

  if (role === 'ADMIN') {
    return ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  }

  if (role === 'EMPLOYEE') {
    const d = (dept || 'cashier').toLowerCase();
    const allowed = EMPLOYEE_ROUTES[d] || EMPLOYEE_ROUTES['cashier'];
    return allowed.some(r => pathname === r || pathname.startsWith(r + '/'));
  }

  return false;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [role, setRole]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const router   = useRouter();
  const pathname = usePathname();
  const initDone = useRef(false);

  // ─── Fetch profile from backend ──────────────────────────────────────────────
  const fetchProfile = async (token: string, currentUser: User): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) return null;

      const json = await res.json();
      if (json.success && json.data) {
        const dept = json.data.employeeProfile?.position || null;
        const p: UserProfile = {
          id:         json.data.id,
          email:      json.data.email,
          name:       json.data.name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          role:       json.data.role || 'CUSTOMER',
          cafeName:   json.data.settings?.[0]?.cafeName || 'ODFE Cafe',
          employeeId: json.data.employeeProfile?.id || null,
          shift:      json.data.employeeProfile?.shift || null,
          department: dept,
        };
        return p;
      }
      return null;
    } catch {
      return null;
    }
  };

  // ─── Persist role info and redirect ──────────────────────────────────────────
  const applyProfile = useCallback((p: UserProfile, doRedirect: boolean) => {
    setProfile(p);
    setRole(p.role);

    // Persist in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('odfe_role', p.role);
      localStorage.setItem('odfe_name', p.name);
      if (p.department) localStorage.setItem('odfe_dept', p.department);
    }

    // Persist in cookies for server-side middleware
    setCookie('odfe_role', p.role);
    if (p.department) setCookie('odfe_dept', p.department);

    if (!doRedirect) return;

    const isPublicPage = ALWAYS_PUBLIC.includes(pathname);
    const targetHome   = getRoleHome(p.role, p.department);

    if (isPublicPage) {
      // On landing/login page → go to role home
      setIsRedirecting(true);
      router.replace(targetHome);
    } else if (!isRouteAllowed(pathname, p.role, p.department)) {
      // On a page they're not allowed → forbidden
      setIsRedirecting(true);
      router.replace('/forbidden');
    }
  }, [pathname, router]);

  // ─── Refresh profile (called externally) ─────────────────────────────────────
  const refreshProfile = async () => {
    if (!user) return;
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.access_token) return;
    const p = await fetchProfile(s.access_token, user);
    if (p) applyProfile(p, false);
  };

  // ─── Bootstrap on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      setLoading(true);

      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        const p = await fetchProfile(currentSession.access_token, currentSession.user);
        if (p) {
          applyProfile(p, true);
        } else {
          // Session exists but user not in public.users yet (or profile API down)
          // Use localStorage cache or user_metadata as fallback
          const cachedRole = typeof window !== 'undefined' ? localStorage.getItem('odfe_role') : null;
          const cachedDept = typeof window !== 'undefined' ? localStorage.getItem('odfe_dept') : null;
          const metaRole   = currentSession.user.user_metadata?.role as string | undefined;

          const fallbackRole = cachedRole || metaRole || null;
          if (fallbackRole) {
            const fallbackProfile: UserProfile = {
              id:         currentSession.user.id,
              email:      currentSession.user.email || '',
              name:       currentSession.user.user_metadata?.full_name || 'User',
              role:       fallbackRole,
              department: cachedDept || undefined,
            };
            applyProfile(fallbackProfile, true);
          } else {
            // No role info at all — redirect to login so they can re-authenticate
            setLoading(false);
            router.replace('/login');
            return;
          }
        }
      }

      setLoading(false);
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auth state change listener ───────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
          setIsRedirecting(false);

          deleteCookie('odfe_role');
          deleteCookie('odfe_dept');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('odfe_role');
            localStorage.removeItem('odfe_name');
            localStorage.removeItem('odfe_dept');
          }

          const publicPages = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/customer-display'];
          if (!publicPages.some(p => pathname === p || pathname.startsWith('/self-order'))) {
            router.push('/login');
          }
          return;
        }

        if (newSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setSession(newSession);
          setUser(newSession.user);

          // Don't re-fetch profile on TOKEN_REFRESHED if we already have it
          if (event === 'TOKEN_REFRESHED' && profile) return;

          const p = await fetchProfile(newSession.access_token, newSession.user);
          if (p) applyProfile(p, true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [pathname, profile, applyProfile, router]);

  // ─── Stop redirect spinner after navigation completes ─────────────────────────
  useEffect(() => {
    setIsRedirecting(false);
  }, [pathname]);

  // ─── Logout ───────────────────────────────────────────────────────────────────
  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // SIGNED_OUT event handler clears everything
  };

  const isAuthenticated = !!session;

  if (loading || isRedirecting) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ loading, session, user, profile, role, isAuthenticated, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { getToken, setToken, clearToken } from '@/utils/token';

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
  user: UserProfile | null;
  profile: UserProfile | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  user: null,
  profile: null,
  role: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

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

async function fetchProfile(token: string): Promise<UserProfile | null> {
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
      return {
        id:         json.data.id,
        email:      json.data.email,
        name:       json.data.name || 'User',
        role:       json.data.role || 'CUSTOMER',
        cafeName:   json.data.settings?.[0]?.cafeName || 'ODFE Cafe',
        employeeId: json.data.employeeProfile?.id || null,
        shift:      json.data.employeeProfile?.shift || null,
        department: dept,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]         = useState<UserProfile | null>(null);
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [role, setRole]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [token, setTokenState]   = useState<string | null>(null);

  const router   = useRouter();
  const pathname = usePathname();
  const initDone = useRef(false);

  const persistAndRedirect = useCallback((p: UserProfile, doRedirect: boolean) => {
    setProfile(p);
    setUser(p);
    setRole(p.role);

    setCookie('odfe_role', p.role);
    if (p.department) setCookie('odfe_dept', p.department);

    if (typeof window !== 'undefined') {
      localStorage.setItem('odfe_role', p.role);
      localStorage.setItem('odfe_name', p.name);
      if (p.department) localStorage.setItem('odfe_dept', p.department);
    }

    if (!doRedirect) return;

    const isAuthPage   = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);
    const targetHome   = getRoleHome(p.role, p.department);

    if (isAuthPage) {
      setIsRedirecting(true);
      router.replace(targetHome);
    } else if (!isRouteAllowed(pathname, p.role, p.department)) {
      setIsRedirecting(true);
      router.replace('/forbidden');
    }
  }, [pathname, router]);

  const refreshProfile = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    const p = await fetchProfile(t);
    if (p) persistAndRedirect(p, false);
  }, [persistAndRedirect]);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      setLoading(true);
      const storedToken = getToken();

      if (storedToken) {
        setTokenState(storedToken);
        const p = await fetchProfile(storedToken);
        if (p) {
          persistAndRedirect(p, true);
        } else {
          const cachedRole = typeof window !== 'undefined' ? localStorage.getItem('odfe_role') : null;
          const cachedDept = typeof window !== 'undefined' ? localStorage.getItem('odfe_dept') : null;
          if (cachedRole) {
            const fallbackProfile: UserProfile = {
              id: '', email: '',
              name: localStorage.getItem('odfe_name') || 'User',
              role: cachedRole,
              department: cachedDept || undefined,
            };
            persistAndRedirect(fallbackProfile, true);
          } else {
            setLoading(false);
            router.replace('/login');
            return;
          }
        }
      } else {
        const publicPages = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/customer-display'];
        const isPublic = publicPages.includes(pathname) || ALWAYS_PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
        if (!isPublic) {
          router.replace('/login');
        }
      }

      setLoading(false);
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsRedirecting(false);
  }, [pathname]);

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return { success: false, message: json.message || 'Registration failed' };
      }

      return { success: true, message: json.message || 'Registration successful' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error occurred' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!json.success) {
        return { success: false, message: json.message || 'Invalid email or password' };
      }

      const { accessToken, role: userRole, refreshToken, name } = json.data;

      setToken(accessToken);
      setTokenState(accessToken);
      if (refreshToken) {
        localStorage.setItem('odfe_refresh', refreshToken);
      }

      const p: UserProfile = {
        id: json.data.id,
        email: json.data.email,
        name: name || email.split('@')[0],
        role: userRole || 'ADMIN',
        department: json.data.employeeProfile?.position || undefined,
      };

      persistAndRedirect(p, true);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error. Is the server running?' };
    }
  };

  const logout = async () => {
    const currentToken = token || getToken();
    if (currentToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
        });
      } catch {}
    }

    setUser(null);
    setProfile(null);
    setRole(null);
    setTokenState(null);
    setIsRedirecting(false);

    clearToken();
    deleteCookie('odfe_role');
    deleteCookie('odfe_dept');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('odfe_role');
      localStorage.removeItem('odfe_name');
      localStorage.removeItem('odfe_dept');
    }

    router.push('/login');
  };

  const isAuthenticated = !!token && !!role;

  if (loading || isRedirecting) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ loading, user, profile, role, isAuthenticated, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

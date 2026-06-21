import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes only guests can access
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

// Routes that are always accessible (customer-facing, no auth needed)
const ALWAYS_PUBLIC_PREFIXES = ['/self-order', '/s/', '/customer-display'];

// Admin-only routes
const ADMIN_ROUTES = [
  '/dashboard', '/products', '/categories', '/employees',
  '/coupons', '/promotions', '/bookings', '/reports', '/settings',
  '/payment-methods', '/floors', '/profile',
];

// Cashier-accessible routes
const CASHIER_ROUTES = ['/pos', '/orders', '/customers', '/tables', '/payments', '/profile'];

// Kitchen-accessible routes  
const KITCHEN_ROUTES = ['/kitchen', '/profile'];

// Billing-accessible routes
const BILLING_ROUTES = ['/payments', '/customer-display', '/profile'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  // Always allow customer-facing routes
  if (ALWAYS_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Create Supabase client that reads from cookies (SSR)
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthenticated = !!user;

  // UNAUTHENTICATED: redirect to login for protected routes
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Get role and dept from cookies
  const roleCookie = req.cookies.get('odfe_role')?.value;
  const deptCookie = req.cookies.get('odfe_dept')?.value;

  // AUTHENTICATED on public/landing page: redirect to their dashboard
  if (isAuthenticated && isPublicRoute) {
    const targetUrl = req.nextUrl.clone();

    if (roleCookie === 'ADMIN') {
      targetUrl.pathname = '/dashboard';
    } else if (roleCookie === 'EMPLOYEE') {
      const dept = (deptCookie || '').toLowerCase();
      if (dept === 'kitchen') targetUrl.pathname = '/kitchen';
      else if (dept === 'orders') targetUrl.pathname = '/orders';
      else if (dept === 'billing') targetUrl.pathname = '/payments';
      else targetUrl.pathname = '/pos';
    } else {
      // No role cookie yet — let the client-side AuthContext handle it
      return response;
    }

    return NextResponse.redirect(targetUrl);
  }

  // ROLE-BASED ACCESS CONTROL FOR PROTECTED ROUTES
  if (isAuthenticated && !isPublicRoute) {
    // If the path is just /forbidden, allow it
    if (pathname === '/forbidden') return response;

    let isAuthorized = true;

    if (roleCookie === 'ADMIN') {
      // Admins might not have all employee routes in ADMIN_ROUTES, but let's assume they can access almost anything.
      // Alternatively, we can restrict admins to ONLY ADMIN_ROUTES and employee routes if needed.
      // Usually admins can access anything or their specific dashboard. Let's strictly enforce ADMIN_ROUTES for now.
      // Actually, admins often need to access POS, Kitchen, etc. But to be safe let's just let Admin access everything.
      // For this demo, let's allow Admin to access everything.
    } else if (roleCookie === 'EMPLOYEE') {
      const dept = (deptCookie || '').toLowerCase();
      
      const checkAccess = (allowedRoutes: string[]) => {
        return allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
      };

      if (dept === 'kitchen') {
        isAuthorized = checkAccess(KITCHEN_ROUTES);
      } else if (dept === 'billing') {
        isAuthorized = checkAccess(BILLING_ROUTES);
      } else {
        // Default to cashier
        isAuthorized = checkAccess(CASHIER_ROUTES);
      }
    } else {
      // Unknown role, might be missing cookie. Let AuthContext handle or just allow for now.
    }

    if (!isAuthorized) {
      const forbiddenUrl = req.nextUrl.clone();
      forbiddenUrl.pathname = '/forbidden';
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];
const ALWAYS_PUBLIC_PREFIXES = ['/self-order', '/s/', '/customer-display'];

const ADMIN_ROUTES = [
  '/dashboard', '/products', '/categories', '/employees',
  '/coupons', '/promotions', '/bookings', '/reports', '/settings',
  '/payment-methods', '/floors', '/profile',
];

const CASHIER_ROUTES = ['/pos', '/orders', '/customers', '/tables', '/payments', '/profile'];
const KITCHEN_ROUTES = ['/kitchen', '/profile'];
const BILLING_ROUTES = ['/payments', '/customer-display', '/profile'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (ALWAYS_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const roleCookie = req.cookies.get('odfe_role')?.value;
  const deptCookie = req.cookies.get('odfe_dept')?.value;
  const isAuthenticated = !!roleCookie;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublicRoute) {
    if (pathname === '/') {
      return NextResponse.next();
    }

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
      return NextResponse.next();
    }

    return NextResponse.redirect(targetUrl);
  }

  if (isAuthenticated && !isPublicRoute) {
    if (pathname === '/forbidden') return NextResponse.next();

    let isAuthorized = true;

    if (roleCookie === 'EMPLOYEE') {
      const dept = (deptCookie || '').toLowerCase();

      const checkAccess = (allowedRoutes: string[]) => {
        return allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
      };

      if (dept === 'kitchen') {
        isAuthorized = checkAccess(KITCHEN_ROUTES);
      } else if (dept === 'billing') {
        isAuthorized = checkAccess(BILLING_ROUTES);
      } else {
        isAuthorized = checkAccess(CASHIER_ROUTES);
      }
    }

    if (!isAuthorized) {
      const forbiddenUrl = req.nextUrl.clone();
      forbiddenUrl.pathname = '/forbidden';
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

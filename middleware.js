import { NextResponse } from 'next/server';

export function middleware(request) {
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value;
  const { pathname, searchParams } = request.nextUrl;

  if (searchParams.has('table') || searchParams.has('id') || searchParams.has('token')) {
    return NextResponse.next();
  }
  
  const isLoginPage = pathname === '/';
  const hasTableParams = searchParams.has('table') || searchParams.has('id');

  // ເງື່ອນໄຂລູກຄ້າ
  const isCustomerRoute = 
    pathname.startsWith('/table') || 
    pathname.startsWith('/my-oder') ||
    (pathname === '/' && hasTableParams);

  if (isCustomerRoute) {
    return NextResponse.next();
  }

  // ເງື່ອນໄຂ Admin
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/home', request.url));
  }
  

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf)$).*)',
  ],
};
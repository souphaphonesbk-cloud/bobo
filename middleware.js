import { NextResponse } from 'next/server'

export function middleware(request) {
  // 1. ອ່ານຄ່າ Cookie ທີ່ເຮົາຝັງໄວ້ຕອນລັອກອິນ
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value
  const url = request.nextUrl.clone()
  const { pathname,searchParams } = url
  const hasTableParams = searchParams.has('table') || searchParams.has('id');
  const isLoginPage = pathname === '/'

  // 🌟 2. ເພີ່ມເງື່ອນໄຂຍົກເວັ້ນ: ສະເພາະໜ້າຂອງລູກຄ້າເທົ່ານັ້ນ (ເອົາ /login ອອກຈາກກຸ່ມນີ້)
  const isCustomerRoute = 
    pathname.startsWith('/table') || 
    pathname.startsWith('/customer') ||
    pathname.startsWith('/my-oder') ||
    (pathname === '/' && hasTableParams);

console.log("Current Path:", pathname, "isCustomer:", isCustomerRoute);
  // 2. ຖ້າເປັນ Path ຂອງລູກຄ້າ -> ປ່ອຍຜ່ານທັນທີ (ບໍ່ກວດສິດ)
  if (isCustomerRoute) {
    return NextResponse.next();
  }

  // 🎯 ເງື່ອນໄຂທີ 1: ຖ້າ "ຍັງບໍ່ລັອກອິນ" ແລະ "ບໍ່ໄດ້ຢູ່ໜ້າ login" -> ໃຫ້ດີດໄປໜ້າ login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 🎯 ເງື່ອນໄຂທີ 2: ຖ້າ "ລັອກອິນແລ້ວ" ແຕ່ພະຍາຍາມເຂົ້າໜ້າ login -> ໃຫ້ດີດໄປ Dashboard ທັນທີ
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match ທຸກໆ paths ຍົກເວັ້ນ:
     * - api (endpoints ຕ່າງໆ)
     * - _next/static (ຟາຍ static, CSS, JS ຂອງ Next.js)
     * - _next/image (ຟາຍຮູບພາບລະບົບ)
     * - favicon.ico (ໄອຄອນເວັບ)
     * - ຟາຍ Fonts ແລະ ຮູບພາບຕ່າງໆ (.woff, .woff2, .ttf, .svg, .png, .jpg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf)$).*)',
  ],
}
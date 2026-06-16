import { NextResponse } from 'next/server'

export function middleware(request) {
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value
  const { pathname } = request.nextUrl

  if (
    pathname === '/' || 
    pathname.startsWith('/table') || 
    pathname.startsWith('/customer') ||
    pathname.startsWith('/my-oder') // ໝາຍເຫດ: ໃຫ້ກວດເບິ່ງວ່າສະກົດຖືກບໍ່ (order ບໍ່ແມ່ນ oder)
  ) {
    return NextResponse.next()
  }

  // 2. ເງື່ອນໄຂສຳລັບ Admin (ພາກສ່ວນທີ່ເຫຼືອທັງໝົດທີ່ບໍ່ແມ່ນ Public)
  
  // ຖ້າ "ຍັງບໍ່ລັອກອິນ" -> ດີດໄປໜ້າ Login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ຖ້າ "ລັອກອິນແລ້ວ" ແຕ່ພະຍາຍາມເຂົ້າໜ້າ Login -> ໃຫ້ໄປໜ້າ Dashboard
  if (isLoggedIn && pathname === '/') {
    return NextResponse.redirect(new URL('/admin/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf)$).*)',
  ],
}
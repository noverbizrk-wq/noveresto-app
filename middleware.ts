import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('nr_token')?.value
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/app/login', req.url))
  }
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/app/dashboard', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*', '/login'] }

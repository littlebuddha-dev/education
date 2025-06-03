// ✅ middleware.js（JWT を Cookie から検査）
import { NextResponse } from 'next/server';

// ログイン不要ページの一覧
const exemptPaths = [
  '/login',
  '/users/register',
  '/api/users/login',
  '/api/users/register',
  '/favicon.ico'
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value; // ✅ Cookieから取得

  console.log(`Middleware: Checking auth for path: ${pathname}`);

  if (exemptPaths.some(p => pathname.startsWith(p))) {
    console.log(`Middleware: Skipped for exempt path: ${pathname}`);
    return NextResponse.next();
  }

  if (!token) {
    console.warn(`Middleware: No token for ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname); // ✅ 元に戻る用
    return NextResponse.redirect(loginUrl);
  }

  console.log(`Middleware: Token found for ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat/:path*',
    '/users/:path*',
    '/children/:path*',
    '/admin/:path*',
    '/api/chat/:path*',
    '/api/users/:path*',
    '/api/children/:path*',
    '/api/admin/:path*',
    '/api/skills/:path*'
  ]
};

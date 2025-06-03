// littlebuddha-dev/education/education-0c8aa7b4e15b5720ef44b74b6bbc36cb09462a21/src/middleware.js
import { NextResponse } from 'next/server';

// ログイン不要ページの一覧
const exemptPaths = [
  '/login',
  '/users/register',
  '/api/users/login',
  '/api/users/register',
  '/favicon.ico',
  '/setup', // ✅ 追加: セットアップページ
  '/api/setup', // ✅ 追加: セットアップAPI
  '/api/tables' // ✅ 追加: テーブル存在チェック用API
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  console.log(`Middleware: Checking auth for path: ${pathname}`);

  if (exemptPaths.some(p => pathname.startsWith(p))) {
    console.log(`Middleware: Skipped for exempt path: ${pathname}`);
    return NextResponse.next();
  }

  if (!token) {
    console.warn(`Middleware: No token for ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log(`Middleware: Token found for ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any_other_path (e.g. public folder files)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)', // すべてのパスに適用
    '/chat/:path*',
    '/users/:path*',
    '/children/:path*',
    '/admin/:path*',
    '/api/chat/:path*',
    '/api/users/:path*',
    '/api/children/:path*',
    '/api/admin/:path*',
    '/api/skills/:path*',
    '/api/setup', // Explicitly add /api/setup
    '/api/tables' // Explicitly add /api/tables
  ]
};

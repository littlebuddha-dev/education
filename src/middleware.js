// src/middleware.js
import { NextResponse } from 'next/server';

// ログイン不要ページの一覧
const exemptPaths = [
  '/login',
  '/users/register',
  '/api/users/login',
  '/api/users/register',
  '/favicon.ico',
  '/setup',
  '/api/setup',
  '/api/tables',
  '/api/users/check-admin',
  '/_next', // Next.jsの内部ファイル
  '/static', // 静的ファイルや静的アセット
  '/_app' // Next.jsの内部アセット (version.json, immutable/nodesなど)
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  console.log(`Middleware: パス: ${pathname}, トークン: ${token ? '有り' : '無し'}`);

  // 除外パスの確認
  if (exemptPaths.some(p => pathname.startsWith(p))) {
    console.log(`Middleware: 除外パス: ${pathname}, アクセス許可`);
    return NextResponse.next();
  }

  // トークンが無い場合
  if (!token) {
    console.log(`Middleware: トークンなし、ログインページにリダイレクト: ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // トークンの簡易検証
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Middleware: 無効なトークン形式');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ペイロードのデコード（期限切れチェック）
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.log('Middleware: トークンが期限切れ');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      const response = NextResponse.redirect(loginUrl);
      // 期限切れのCookieを削除
      response.cookies.set('token', '', { maxAge: 0, path: '/' });
      return response;
    }

    console.log(`Middleware: 有効なトークン、アクセス許可: ${pathname}`);
    return NextResponse.next();

  } catch (err) {
    console.error('Middleware: トークンデコードエラー:', err);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    const response = NextResponse.redirect(loginUrl);
    // 無効なCookieを削除
    response.cookies.set('token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * 以下のパス以外のすべてのリクエストにマッチします:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /static/ (your custom static assets)
     * - /_app/ (Next.js internal files like version.json, immutable nodes)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};

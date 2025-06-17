// src/middleware.js
// タイトル: Next.js ミドルウェア
// 役割: 保護されたページへのアクセスをサーバーサイドで検証し、未認証ユーザーをログインページにリダイレクトします。

import { NextResponse } from 'next/server';
import { publicPaths } from '@/lib/authConfig'; // [修正] 共通設定ファイルからインポート

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  console.log(`Middleware: パス: ${pathname}, トークン: ${token ? '有り' : '無し'}`);

  // [修正] startsWithチェックに加え、完全一致も考慮
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p) || pathname === p.replace(/\/$/, ''));

  if (isPublicPath) {
    console.log(`Middleware: 公開パス: ${pathname}, アクセス許可`);
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
      throw new Error('無効なトークン形式');
    }

    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.log('Middleware: トークンが期限切れ');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set('token', '', { maxAge: 0, path: '/' }); // 期限切れCookieを削除
      return response;
    }

    console.log(`Middleware: 有効なトークン、アクセス許可: ${pathname}`);
    return NextResponse.next();

  } catch (err) {
    console.error('Middleware: トークンデコードエラー:', err.message);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('token', '', { maxAge: 0, path: '/' }); // 無効なCookieを削除
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
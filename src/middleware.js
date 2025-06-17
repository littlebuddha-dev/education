// src/middleware.js
// タイトル: 認証ミドルウェア（最終確定版）
// 役割: サーバーサイドで全リクエストのアクセス制御を確実に行います。

import { NextResponse } from 'next/server';
import { isPublicPath, isAdminPath } from '@/lib/authConfig';

function validateTokenPayload(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    // トークンの有効期限をチェック
    return payload.exp && now < payload.exp ? payload : null;
  } catch (e) {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const userPayload = validateTokenPayload(token);

  // Next.jsの内部リクエストは常に許可
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.endsWith('.ico')) {
    return NextResponse.next();
  }

  const isAccessingPublicPath = isPublicPath(pathname);

  // 【ケース1】認証済みユーザー
  if (userPayload) {
    // ログインページにアクセスしようとしたら、ダッシュボードにリダイレクト
    if (pathname === '/login' || pathname === '/users/register') {
      const targetUrl = new URL(userPayload.role === 'admin' ? '/admin/users' : '/children', request.url);
      return NextResponse.redirect(targetUrl);
    }
    // 管理者以外のユーザーが管理者ページにアクセスしようとしたら、トップページにリダイレクト
    if (isAdminPath(pathname) && userPayload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // 上記以外はアクセスを許可
    return NextResponse.next();
  }

  // 【ケース2】未認証ユーザー
  if (!userPayload) {
    // 公開パスならアクセスを許可
    if (isAccessingPublicPath) {
      return NextResponse.next();
    }
    // 保護されたパスならログインページにリダイレクト
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
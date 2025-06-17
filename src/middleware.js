// src/middleware.js
// 修正版：確実な認証チェック
import { NextResponse } from 'next/server';
import { isPublicPath, isAdminPath } from '@/lib/authConfig';

function validateTokenStructure(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && now >= payload.exp) {
      console.log('🕐 Token expired');
      return null;
    }

    if (!payload.id || !payload.email || !payload.role) {
      console.log('📋 Token missing fields');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('❌ Token validation error:', error.message);
    return null;
  }
}

function clearTokenCookie(response) {
  response.cookies.set('token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  console.log(`🚀 Middleware: ${pathname} - Token: ${token ? 'あり' : 'なし'}`);

  // 公開パスの判定
  const isPublic = isPublicPath(pathname);
  console.log(`🔍 Public path check for ${pathname}: ${isPublic}`);

  if (isPublic) {
    console.log(`🔓 Middleware: 公開パス許可 - ${pathname}`);
    return NextResponse.next();
  }

  // 保護されたパス
  console.log(`🔒 Middleware: 保護されたパス - ${pathname}`);

  if (!token) {
    console.log(`❌ Middleware: 未認証 - ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = validateTokenStructure(token);
  if (!payload) {
    console.log(`❌ Middleware: 無効トークン - ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log(`👤 Middleware: 認証済み - ${payload.email} (${payload.role})`);

  // 管理者パスの権限チェック
  if (isAdminPath(pathname)) {
    if (payload.role !== 'admin') {
      console.log(`🚫 Middleware: 管理者権限不足 - ${pathname}`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'insufficient_privileges');
      return NextResponse.redirect(loginUrl);
    }
    console.log(`✅ Middleware: 管理者権限OK - ${pathname}`);
  }

  console.log(`✅ Middleware: アクセス許可 - ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

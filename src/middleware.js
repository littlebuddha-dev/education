// /src/middleware.js
// 役割: 認証状態に応じたルート保護（リフレッシュトークンベースに修正）

import { NextResponse } from 'next/server';
import { isPublicPath } from '@/lib/authConfig';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // ✅ 新しい認証方式に合わせて'refreshToken'を確認します
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isAccessingPublic = isPublicPath(pathname);

  // APIルートはそれぞれの認証ロジックを持つため、ミドルウェアでは基本的にスルーします
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Next.jsの内部リクエストや公開パスは常に許可します
  if (
    pathname.startsWith('/_next') ||
    pathname.endsWith('.ico') ||
    isAccessingPublic
  ) {
    return NextResponse.next();
  }

  // 保護されたページにアクセスしようとしているが、リフレッシュトークンがない場合
  if (!refreshToken) {
    // ログインページへのリダイレクトを作成
    const loginUrl = new URL('/login', request.url);
    // 元々アクセスしようとしていたパスをクエリパラメータとして追加
    loginUrl.searchParams.set('redirectTo', pathname);
    
    console.log(`[Middleware] No refreshToken, redirecting to: ${loginUrl.toString()}`);
    return NextResponse.redirect(loginUrl);
  }

  // リフレッシュトークンがあれば、ページへのアクセスを許可
  // 詳細な認証状態の確認はクライアントサイドのAuthProviderに任せます
  return NextResponse.next();
}

export const config = {
  // apiルートを除外（apiルートは独自の認証を持つため）
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
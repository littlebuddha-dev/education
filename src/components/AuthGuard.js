// src/components/AuthGuard.js
// 修正版：authConfig.jsからのインポートを修正し、ロジックを安定化

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
// 🔧 修正: 正しい関数名をインポートします
import { isPublicPage, isAdminPage } from '@/lib/authConfig';

export default function AuthGuard({ children }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // 認証状態が確定するまで待機
    }

    // 🔧 修正: 正しい関数名を使用します
    const isPublic = isPublicPage(pathname);
    
    // ログインページや登録ページかどうかの判定
    const isOnAuthPage = pathname === '/login' || pathname === '/users/register' || pathname === '/setup';

    // --- 認証済みユーザーの処理 ---
    if (isAuthenticated && user) {
      // 認証済みなのにログインページにいる場合、ダッシュボードへリダイレクト
      if (isOnAuthPage) {
        const DASHBOARD_PATHS = {
          admin: '/admin/users',
          parent: '/children',
          child: '/chat',
        };
        const targetPath = DASHBOARD_PATHS[user.role] || '/';
        router.replace(targetPath);
        return;
      }

      // 管理者ページへのアクセス権限をチェック
      if (isAdminPage(pathname) && user.role !== 'admin') {
        console.log(`[権限エラー] ${user.role}は${pathname}にアクセスできません。`);
        router.replace('/'); // 権限がない場合はトップページに戻す
        return;
      }
    }

    // --- 未認証ユーザーの処理 ---
    if (!isAuthenticated && !isPublic) {
      // 保護されたページへのアクセスはログインページにリダイレクト
      const redirectTo = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

  }, [isLoading, isAuthenticated, user, pathname, router, searchParams]);

  // 認証状態を待っている間は、グローバルなローディング画面を表示
  if (isLoading) {
    return (
      <main style={{ padding: "2rem", textAlign: "center", height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.2em', color: '#888' }}>認証情報を確認しています...</p>
      </main>
    );
  }

  // 認証チェックが完了したら、ページ本体を表示
  return <>{children}</>;
}
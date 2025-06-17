// src/app/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/utils/authUtils';
import { jwtDecode } from 'jwt-decode';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkStatusAndRedirect = async () => {
      console.log('HomePage: checkStatusAndRedirect 開始');

      try {
        // 1. データベースとテーブルの存在チェック (setup APIに依存)
        // usersテーブルが存在しない場合、/api/users/check-adminは adminExists: false を返す
        const adminCheckRes = await fetch('/api/users/check-admin');
        const adminCheckData = await adminCheckRes.json();
        console.log('HomePage: /api/users/check-admin 応答:', adminCheckData);

        if (!adminCheckData.adminExists && (adminCheckData.error && (adminCheckData.error.includes('テーブルが存在しません') || adminCheckData.error.includes('データベースが存在しない')))) {
          console.log('HomePage: UsersテーブルまたはDBが存在しません。/setup にリダイレクトします。');
          router.replace('/setup');
          setLoading(false);
          return;
        }

        // 2. 認証トークンの確認
        const token = getCookie('token');
        console.log('HomePage: トークン確認 (getCookie):', token ? '有り' : '無し');

        if (token) {
          try {
            const decoded = jwtDecode(token);
            console.log('HomePage: トークンデコード成功、ユーザーロール:', decoded.role);
            let targetPath;
            if (decoded.role === 'child') {
              targetPath = '/chat';
            } else if (decoded.role === 'parent') {
              targetPath = '/children';
            } else if (decoded.role === 'admin') {
              targetPath = '/admin/users';
            } else {
              targetPath = '/'; // 未定義ロール
            }
            console.log(`HomePage: 認証済みユーザーを ${targetPath} にリダイレクト`);
            router.replace(targetPath);
          } catch (err) {
            console.error('HomePage: トークン解析エラー:', err);
            // 無効なトークンは削除してログインページへ
            document.cookie = 'token=; Max-Age=0; path=/;';
            router.replace('/login');
          }
        } else {
          // トークンがない場合、ミドルウェアによって/loginにリダイレクトされるはず
          // ここでは何もしないか、最終的なフォールバックとしてログインページにリダイレクト
          console.log('HomePage: トークンなし。ミドルウェアが /login にリダイレクトするはずです。');
          // router.replace('/login'); // 必要であればここでもリダイレクトを強制
        }
      } catch (err) {
        console.error('HomePage: 初期チェック中にエラー発生:', err);
        setError('システムの初期状態を確認できませんでした。サーバーが起動しているか確認してください。');
        // 重大なエラーの場合は setup ページへ誘導
        router.replace('/setup');
      } finally {
        setLoading(false);
      }
    };

    checkStatusAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>システム初期化中...</h1>
        <p>セットアップ状況と認証状態を確認しています。</p>
      </main>
    );
  }

  // エラーが発生した場合、ユーザーにメッセージを表示
  if (error) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>エラー</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p style={{ marginTop: '1rem' }}>
          もしシステムがまだセットアップされていないようでしたら、<a href="/setup">セットアップページ</a>へアクセスしてください。
        </p>
      </main>
    );
  }

  // ロードが完了し、リダイレクトが完了していない場合はこのコンポーネントは一時的に表示されるが、
  // 最終的にはredirectによって別のページに遷移する。
  // そのため、ここでは最小限の表示にとどめる。
  return (
    <main style={{ padding: "2rem" }}>
      <h1>教育AIシステムへようこそ！</h1>
      <p>適切なページへ移動しています...</p>
    </main>
  );
}
// littlebuddha-dev/education/education-0c8aa7b4e15b5720ef44b74b6bbc36cb09462a21/src/app/page.js
'use client'; // これを忘れずに！

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode'; // jwt-decode を直接インポート

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const router = useRouter();

  // Cookieからトークンを取得するヘルパー関数
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  useEffect(() => {
    async function checkSetupAndAuth() {
      const token = getCookie('token');

      if (token) {
        // トークンがあれば、ログイン済みと判断して適切なページへリダイレクト
        try {
          const decoded = jwtDecode(token);
          console.log('User logged in:', decoded);

          if (decoded.role === 'child') {
            router.replace('/chat');
          } else if (decoded.role === 'parent') {
            router.replace('/children');
          } else if (decoded.role === 'admin') {
            router.replace('/admin/users');
          }
          setLoading(false); // リダイレクト先が決まったらローディングを終了
          return; // リダイレクトしたら処理を終了
        } catch (decodeError) {
          console.error('Token decode error in HomePage:', decodeError);
          // トークンが無効なら、ログイン状態ではないので次へ進む
          document.cookie = 'token=; Max-Age=0; path=/;'; // 無効なトークンは削除
        }
      }

      // トークンがない、または無効な場合、セットアップ状況をチェック
      try {
        const tableCheckRes = await fetch('/api/tables');
        const tablesData = await tableCheckRes.json();
        const usersTableExists = tablesData.some(table => table.table_name === 'users');

        if (!usersTableExists) {
          // users テーブルが存在しない場合、セットアップページへリダイレクト
          console.log('Users table not found. Redirecting to setup.');
          router.replace('/setup');
          return;
        }

        // users テーブルが存在する場合、ログインページへ進む
        // Adminユーザーの存在チェックは setup ページでハンドルされるか、
        // ログイン試行時にエラーとして保護者・管理者が対応することになる
        console.log('Users table exists. Redirecting to login.');
        router.replace('/login'); // 修正: 常にログインページへリダイレクト
        setLoading(false); // リダイレクト先が決まったらローディングを終了
        return;

      } catch (err) {
        console.error('Setup check error:', err);
        setDbError(true);
        setLoading(false);
        console.log('Database or admin check failed, redirecting to setup as fallback.');
        router.replace('/setup'); // DB接続自体ができない場合もセットアップに誘導
      }
    }

    checkSetupAndAuth();
  }, [router]);

  if (loading) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>システム初期化中...</h1>
        <p>セットアップ状況を確認しています。</p>
      </main>
    );
  }

  if (dbError) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>エラー</h1>
        <p>データベース接続または初期設定に問題があります。`/setup` ページにアクセスして設定を確認してください。</p>
      </main>
    );
  }

  // トークンがなければ、ログインを促すコンテンツを表示
  return (
    <main style={{ padding: "2rem" }}>
      <h1>教育AIシステムへようこそ！</h1>
      <p>ログインしてサービスを開始してください。</p>
      <div style={{ marginTop: '1rem' }}>
        <a href="/login" style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          ログイン
        </a>
        <a href="/users/register" style={{ marginLeft: '1rem', padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          新規登録
        </a>
      </div>
    </main>
  );
}

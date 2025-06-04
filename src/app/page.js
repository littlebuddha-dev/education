// littlebuddha-dev/education/education-0c8aa7b4e15b5720ef44b74b6bbc36cb09462a21/src/app/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/utils/authUtils';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSetupAndAuth = async () => {
      console.log('HomePage: checkSetupAndAuth 開始'); // 追加

      let usersTableExists = false;
      let isDbConnected = false;
      try {
        console.log('HomePage: /api/tables をフェッチ中...'); // 追加
        const tableCheckRes = await fetch('/api/tables');
        const data = await tableCheckRes.json();
        console.log('HomePage: /api/tables 応答:', data); // 追加

        isDbConnected = data.success;
        if (isDbConnected) {
          usersTableExists = data.tables.some(table => table.table_name === 'users');
          console.log('HomePage: usersTableExists:', usersTableExists); // 追加
        }
      } catch (err) {
        console.error('HomePage: DB接続またはテーブルチェック失敗:', err); // 追加
        setDbError(true);
        setLoading(false);
        router.replace('/setup');
        return;
      }

      if (!isDbConnected || !usersTableExists) {
        console.log('HomePage: DB接続なし、またはUsersテーブルが見つかりません。/setup にリダイレクトします。'); // 追加
        router.replace('/setup');
        setLoading(false);
        return;
      }

      const token = getCookie('token');
      console.log('HomePage: トークン確認 (getCookie):', token ? '有り' : '無し'); // 追加

      if (token) {
        console.log('HomePage: トークン有り。認証フローを続行します。'); // 追加
        setLoading(false);
      } else {
        console.log('HomePage: トークンなし、/login にリダイレクトします。'); // 追加
        router.replace('/login');
        setLoading(false);
      }
    };

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

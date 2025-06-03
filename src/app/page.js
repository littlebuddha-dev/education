// littlebuddha-dev/education/education-0c8aa7b4e15b5720ef44b74b6bbc36cb09462a21/src/app/page.js
'use client'; // これを忘れずに！

import { useEffect, useState } from 'react'; //
import { useRouter } from 'next/navigation'; //
import { jwtDecode } from 'jwt-decode'; // jwt-decode を直接インポート

export default function HomePage() {
  const [loading, setLoading] = useState(true); //
  const [dbError, setDbError] = useState(false); //
  const router = useRouter(); //

  // Cookieからトークンを取得するヘルパー関数
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)')); //
    return match ? match[2] : null; //
  };

  useEffect(() => {
    async function checkSetupAndAuth() {
      const token = getCookie('token'); //

      // まず、テーブルが存在するかどうかを確認
      let usersTableExists = false;
      let isDbConnected = false;
      try {
        const tableCheckRes = await fetch('/api/tables'); //
        const data = await tableCheckRes.json(); //
        isDbConnected = data.success; //
        if (isDbConnected) { //
          usersTableExists = data.tables.some(table => table.table_name === 'users'); //
        }
      } catch (err) {
        console.error('Failed to check table existence or DB connection:', err);
        setDbError(true);
        setLoading(false);
        router.replace('/setup'); // DB接続エラーの場合は、セットアップページへ誘導
        return;
      }

      if (!isDbConnected || !usersTableExists) {
        // DB接続ができていない、またはusersテーブルが存在しない場合、セットアップページへリダイレクト
        console.log('DB not connected or Users table not found. Redirecting to setup.');
        router.replace('/setup'); //
        setLoading(false);
        return;
      }

      // users テーブルが存在し、DB接続もOKの場合、認証状態を確認
      if (token) {
        try {
          const decoded = jwtDecode(token); //
          console.log('User logged in:', decoded);

          if (decoded.role === 'child') {
            router.replace('/chat'); //
          } else if (decoded.role === 'parent') {
            router.replace('/children'); //
          } else if (decoded.role === 'admin') {
            router.replace('/admin/users'); //
          }
          setLoading(false); //
          return; //
        } catch (decodeError) {
          console.error('Token decode error in HomePage:', decodeError);
          document.cookie = 'token=; Max-Age=0; path=/;'; // 無効なトークンは削除
          // トークンが無効なら、ログインページへ進む
          router.replace('/login'); //
          setLoading(false); //
          return; //
        }
      }

      // トークンがなく、users テーブルが存在し、DB接続もOKの場合、ログインページへリダイレクト
      console.log('No token and users table exists. Redirecting to login.');
      router.replace('/login'); //
      setLoading(false); //
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

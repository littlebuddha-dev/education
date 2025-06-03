// littlebuddha-dev/education/education-0c8aa7b4e15b5720ef44b74b6bbc36cb09462a21/src/app/page.js
'use client'; // ✅ クライアントコンポーネント化

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSetup() {
      try {
        // 1. users テーブルが存在するかチェック
        const tableCheckRes = await fetch('/api/tables');
        const tablesData = await tableCheckRes.json();
        const usersTableExists = tablesData.some(table => table.table_name === 'users');

        if (!usersTableExists) {
          // users テーブルが存在しない場合、セットアップページへリダイレクト
          console.log('Users table not found. Redirecting to setup.');
          router.replace('/setup');
          return;
        }

        // 2. 管理者ユーザーが存在するかチェック
        // Note: このAPIは認証が必要ですが、ここでは存在チェックのみのため、
        // 実際には `/api/users` にて管理者ユーザーが存在するかどうかの簡易チェックを実装する必要があります。
        // （現行の /api/admin/users は認証済みのadminロールが必要なので、そのままだと使えない）
        // 一時的な回避策として、/api/users (全ユーザー取得API) にてadminユーザーが1人でもいればOKとする。
        // あるいは、認証なしで管理者ユーザーの存在をチェックする新しいAPIを作成する。
        // ここでは、簡易的に /api/users を叩いてエラーでなければテーブルは存在し、
        // もしユーザーがいなければ /setup にリダイレクト、というロジックにする。
        const usersRes = await fetch('/api/users', {
          headers: {
            // ダミーのAuthorizationヘッダー。middlewareで認証ガードされるが、
            // その結果としてログインページにリダイレクトされるため、
            // 実際にはこのfetchは実行されず、middlewareの認証ガードが優先される。
            // したがって、このロジックは主にログイン状態でない初回アクセス時に有効となる。
            // より正確な実装は、認証不要な管理者存在チェックAPIが必要。
            // 現状では、テーブルが存在すれば/loginへリダイレクトされ、そこからログイン後にadmin/usersで確認となる。
            // ここでは、テーブルが存在しないケースに絞って /setup にリダイレクトするロジックとする。
            // もし、テーブルは存在するが管理者ユーザーがいない、というケースも自動化したい場合は、
            // /api/users/check-admin-exists のような認証不要なAPIが必要になります。
          }
        });
        const users = await usersRes.json();

        // テーブルは存在するが、adminユーザーが一人もいない場合もsetupに飛ばす
        if (usersTableExists && usersRes.ok && !users.some(user => user.role === 'admin')) {
          console.log('Admin user not found. Redirecting to setup.');
          router.replace('/setup');
          return;
        }

        // 全てクリアしていれば、そのままトップページを表示
        setLoading(false);

      } catch (err) {
        console.error('Setup check error:', err);
        setDbError(true);
        setLoading(false);
        // DB接続エラーの場合もセットアップページへ誘導することが可能だが、
        // 今回はテーブル存在チェックAPIがDB接続エラーで失敗した場合を考慮。
        // 基本的には、DB接続エラーであれば手動でDBを起動する必要がある。
        // ここではDB接続エラーの場合もセットアップページに遷移させることで、
        // ユーザーに環境変数の確認を促すようにする。
        console.log('Database or admin check failed, redirecting to setup as fallback.');
        router.replace('/setup');
      }
    }

    // `page.js` はサーバーコンポーネントとしても動作するため、`useEffect` 内に記述してクライアントサイドでのみ実行されるようにする。
    // また、API経由でテーブルリストを取得するのは、DB接続情報がサーバ側にあるため、直接アクセスする形にする。
    // `/api/tables` のGETリクエストは認証不要にしているので、middlewareで許可される。
    checkSetup();
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

  // テーブルが存在し、管理者ユーザーもいる場合、通常のトップページコンテンツを表示
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

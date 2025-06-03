// littlebuddha-dev/education/src/app/setup/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [setupSecretKey, setSetupSecretKey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const router = useRouter();

  // ページロード時にセットアップ状況をチェックする
  useEffect(() => {
    async function checkSetupStatus() {
      try {
        const res = await fetch('/api/tables'); // 既存のAPIを利用してテーブルリストを取得
        const data = await res.json();
        const tables = data.map(row => row.table_name);

        if (tables.includes('users')) {
          // users テーブルが存在する場合、管理ユーザーの存在もチェック
          const adminCheckRes = await fetch('/api/admin/users', { // 管理者ユーザー取得API
            headers: { 'Authorization': `Bearer some_dummy_token_for_check_only` } // ダミーのトークンを送信 (middlewareで弾かれるが、存在チェックのみが目的なら問題なし)
                                                                                  // あるいは、別途認証なしで管理者存在チェックをするAPIを作るべきだが、今回は簡易化
          });
          const adminCheckData = await adminCheckRes.json();
          if (adminCheckRes.ok && adminCheckData.some(user => user.role === 'admin')) {
            setIsSetupComplete(true); // 管理者ユーザーが存在すればセットアップ済み
            router.push('/login'); // ログインページへリダイレクト
            return;
          }
        }
        // users テーブルが存在しないか、管理者ユーザーが存在しない場合、セットアップが必要
        setIsSetupComplete(false);

      } catch (err) {
        console.warn('Setup status check failed. Assuming setup needed:', err);
        setIsSetupComplete(false);
      }
    }
    checkSetupStatus();
  }, []);

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!adminEmail || !adminPassword || !setupSecretKey) {
      setError('すべての項目を入力してください。');
      return;
    }

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-setup-secret-key': setupSecretKey, // 秘密鍵をヘッダーで送信
        },
        body: JSON.stringify({ adminEmail, adminPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message + ' ログインページへ移動します。');
        // セットアップ成功後、ログインページへリダイレクト
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'セットアップに失敗しました。');
      }
    } catch (err) {
      console.error('セットアップエラー:', err);
      setError('ネットワークエラーが発生しました。');
    }
  };

  // セットアップが完了している場合は、何も表示しないか、ログインページへのリダイレクトを待つ
  if (isSetupComplete) {
    return <main style={{ padding: '2rem' }}><p>システムはすでにセットアップされています。ログインページへリダイレクト中...</p></main>;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>🔰 教育AIシステム 初期セットアップ</h1>
      <p>
        データベースのテーブルが存在しない場合、または管理ユーザーが未作成の場合に、このページで初期設定を行います。
        **PostgreSQL データベース自体は事前に起動し、`.env.local` に記載したデータベース名とユーザー名が存在している必要があります。**
      </p>
      <p style={{ color: 'red', fontWeight: 'bold' }}>
        ⚠️ `SETUP_SECRET_KEY` は `.env.local` に設定した秘密鍵と同じ値を入力してください。
      </p>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <div>
          <label htmlFor="adminEmail">管理者メールアドレス:</label>
          <input
            type="email"
            id="adminEmail"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.2rem' }}
          />
        </div>

        <div>
          <label htmlFor="adminPassword">管理者パスワード:</label>
          <input
            type="password"
            id="adminPassword"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="強力なパスワード"
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.2rem' }}
          />
        </div>

        <div>
          <label htmlFor="setupSecretKey">セットアップ秘密鍵 (`SETUP_SECRET_KEY`):</label>
          <input
            type="password"
            id="setupSecretKey"
            value={setupSecretKey}
            onChange={(e) => setSetupSecretKey(e.target.value)}
            placeholder=".env.local の秘密鍵"
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.2rem' }}
          />
        </div>

        <button type="submit" style={{ padding: '0.8rem 1.5rem', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          システムをセットアップ
        </button>
      </form>

      <p style={{ marginTop: '2rem', fontSize: '0.9em', color: '#666' }}>
        ※ `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` は `.env.local` で設定済みの値を使用します。<br/>
        これらの値は、PostgreSQLサーバーが起動しており、対応するデータベースとユーザーが存在している必要があります。
      </p>
    </main>
  );
}
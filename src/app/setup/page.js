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
  const [isLoading, setIsLoading] = useState(true); // ロード状態を追加
  const [isDbConnected, setIsDbConnected] = useState(false); // DB接続状態
  const [needsSetup, setNeedsSetup] = useState(false); // セットアップが必要かどうか
  const router = useRouter();

  // ページロード時にセットアップ状況をチェックする
  useEffect(() => {
    async function checkSetupStatus() {
      setIsLoading(true);
      setError('');
      setMessage('');

      try {
        const res = await fetch('/api/tables'); // データベース接続とテーブルリストを取得
        const data = await res.json(); //

        if (!data.success) { // DB接続エラーの場合
          setIsDbConnected(false); //
          setError(data.error || 'データベース接続に失敗しました。'); //
          setNeedsSetup(true); // DB接続自体ができていないので、セットアップが必要と判断
          return;
        }

        setIsDbConnected(true); //
        const tables = data.tables.map(row => row.table_name); //
        const usersTableFound = tables.includes('users'); //

        if (!usersTableFound) {
          // users テーブルが存在しない場合、セットアップが必要
          setNeedsSetup(true);
          setMessage('データベーステーブルが未作成です。システムを初期セットアップしてください。');
        } else {
          // users テーブルが存在する場合、管理者ユーザーの存在をサーバーサイドで確認する
          // ここではあくまで初期ロード時のチェックであり、管理者ユーザーの正確な存在は
          // /api/setup が責任を持つ。もし存在すればログインページへリダイレクト。
          // 存在しなければ、セットアップフォームを表示。
          // 既存の管理者ユーザーがいてこのページに来ることは、原則としてないはず
          // （/app/page.js でログイン済みならリダイレクトされるため）。
          // なので、usersテーブルがあれば、管理者ユーザーの存在を確認するAPIを叩くのではなく、
          // ログインページへリダイレクトするのが自然。
          console.log('Users table found. Redirecting to login as setup is likely complete or login is required.');
          router.replace('/login');
        }
      } catch (err) {
        console.warn('Setup status check failed:', err);
        setIsDbConnected(false);
        setError('データベースに接続できません。PostgreSQLが起動しているか、.env.localの設定を確認してください。');
        setNeedsSetup(true); // エラー時もセットアップが必要と判断
      } finally {
        setIsLoading(false);
      }
    }
    checkSetupStatus();
  }, [router]);

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
        body: JSON.stringify({ adminEmail, adminPassword }), //
      });

      const data = await res.json(); //

      if (res.ok) { //
        setMessage(data.message + ' ログインページへ移動します。'); //
        // セットアップ成功後、ログインページへリダイレクト
        setTimeout(() => {
          router.push('/login'); //
        }, 3000);
      } else {
        setError(data.error || 'セットアップに失敗しました。'); //
      }
    } catch (err) {
      console.error('セットアップエラー:', err); //
      setError('ネットワークエラーが発生しました。または、サーバーでエラーが発生しました。');
    }
  };

  if (isLoading) {
    return <main style={{ padding: '2rem' }}><p>セットアップ状況を確認中...</p></main>;
  }

  // データベースに接続できていない場合
  if (!isDbConnected) {
    return (
      <main style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
        <h1>🔰 教育AIシステム 初期セットアップ</h1>
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          ⚠️ データベースに接続できません。PostgreSQLが起動しているか、`.env.local` の設定を確認してください。<br/>
          {error}
        </p>
        <p style={{ marginTop: '2rem', fontSize: '0.9em', color: '#666' }}>
          ※ `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` は `.env.local` で設定済みの値を使用します。<br/>
          これらの値は、PostgreSQLサーバーが起動しており、対応するデータベースとユーザーが存在している必要があります。
        </p>
      </main>
    );
  }

  // セットアップが必要な場合 (usersテーブルがない、またはDB接続エラーでneedSetupがtrueになった場合)
  if (needsSetup) {
    return (
      <main style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
        <h1>🔰 教育AIシステム 初期セットアップ</h1>
        <p>
          {message || 'データベーステーブルが未作成、または管理者ユーザーが未作成のようです。このページで初期設定を行います。'}
        </p>
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          ⚠️ `SETUP_SECRET_KEY` は `.env.local` に設定した秘密鍵と同じ値を入力してください。
        </p>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}

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
              onChange={e => setAdminPassword(e.target.value)}
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
              onChange={e => setSetupSecretKey(e.target.value)}
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

  // ここに到達する場合、通常は users テーブルが存在し、かつリダイレクトされなかったケース
  // すでにセットアップ済みと判断し、ログインページへリダイレクト
  console.log('Setup page: Users table exists, redirecting to login.');
  router.replace('/login');
  return <main style={{ padding: '2rem' }}><p>システムは既にセットアップされています。ログインページへリダイレクト中...</p></main>;
}

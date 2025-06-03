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
  const [usersTableExists, setUsersTableExists] = useState(false); // usersテーブル存在状態
  const [adminUserExists, setAdminUserExists] = useState(false); // 管理者ユーザー存在状態
  const router = useRouter();

  // ページロード時にセットアップ状況をチェックする
  useEffect(() => {
    async function checkSetupStatus() {
      setIsLoading(true);
      setError('');
      setMessage('');

      try {
        const res = await fetch('/api/tables'); // 既存のAPIを利用してテーブルリストを取得
        const data = await res.json();

        if (!data.success) { // DB接続エラーの場合
          setIsDbConnected(false);
          setError(data.error || 'データベース接続に失敗しました。');
          setIsLoading(false);
          return;
        }

        setIsDbConnected(true);
        const tables = data.tables.map(row => row.table_name);
        const usersTableFound = tables.includes('users');
        setUsersTableExists(usersTableFound);

        if (usersTableFound) {
          // users テーブルが存在する場合、管理者ユーザーの存在も確認
          const adminCheckRes = await fetch('/api/users'); // 管理者ユーザー一覧APIを叩いてチェック（管理者でなくても403が返るのでOK）
          if (adminCheckRes.status === 403) {
            // アクセス権限がない場合、通常は管理者ユーザーが存在しない可能性が高い
            // もしくは、adminユーザー以外がトークンを持って /api/users にアクセスしている場合
            // ここでは簡易的に、adminユーザーがいなければ403と判断する
            const adminCheckData = await adminCheckRes.json();
            if (adminCheckData.error === '管理者専用ページです' || adminCheckData.error === '認証トークン（Cookie）が見つかりません') {
               // ここはAdminUserExists を false としたいが、トークンがない場合や親でアクセスしている場合も403になる。
               // サーバーサイドの /api/setup/route.js でより正確なチェックを行うため、
               // ここでは adminUserExists は setup API の結果に委ねる。
               // ただし、既にログインしている場合は /login にリダイレクトされるため、
               // setup ページに来る時点でトークンがないか、無効な状態であることが多い。
               // したがって、このパスでは adminUserExists が false であると仮定して問題ない。
               setAdminUserExists(false);
            } else {
               // その他のエラー
               setError(adminCheckData.error || '管理者ユーザーの存在確認に失敗しました。');
               setIsLoading(false);
               return;
            }
          } else if (adminCheckRes.ok) {
            // 管理者としてログイン済みで、APIがOKを返した場合
            // すでに管理者ユーザーが存在し、かつアクセスできる状態なので、セットアップ済みと判断
            console.log('Admin user found and accessible. Assuming setup is complete. Redirecting to login.');
            setAdminUserExists(true);
            router.replace('/login');
            setIsLoading(false);
            return;
          } else {
            // その他のステータスコードの場合（例: ログインが必要な場合）
            setAdminUserExists(false); // とりあえず存在しないと仮定
          }

          // テーブルは存在するが、まだ管理者ユーザーがいない、または不明な状態
          if (usersTableFound && !adminUserExists) { // usersTableFound の条件も追加
            setMessage('データベースは存在しますが、管理者ユーザーが未作成のようです。管理者ユーザーを作成してください。');
          } else if (usersTableFound && adminUserExists) {
            // このブロックは通常実行されないはずだが、念のため
            setMessage('システムは既にセットアップされています。ログインページへリダイレクト中...');
            router.replace('/login');
            setIsLoading(false);
            return;
          }

        } else {
          // users テーブルが存在しない場合、セットアップが必要
          setMessage('データベーステーブルが未作成です。システムを初期セットアップしてください。');
        }
      } catch (err) {
        console.warn('Setup status check failed:', err);
        setIsDbConnected(false);
        setError('データベースに接続できません。PostgreSQLが起動しているか、.env.localの設定を確認してください。');
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

  // 既に管理者ユーザーが存在する場合 (usersテーブルも存在)
  // この状態は基本的に /login にリダイレクトされるはずだが、念のため表示
  if (usersTableExists && adminUserExists) { // このブロックは `router.replace('/login')` により到達しないはず
    return <main style={{ padding: '2rem' }}><p>システムはすでにセットアップされています。ログインページへリダイレクト中...</p></main>;
  }


  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>🔰 教育AIシステム 初期セットアップ</h1>
      <p>
        {message || 'データベースのテーブルが存在しない場合、または管理ユーザーが未作成の場合に、このページで初期設定を行います。'}
      </p>
      <p style={{ color: 'red', fontWeight: 'bold' }}>
        ⚠️ `SETUP_SECRET_KEY` は `.env.local` に設定した秘密鍵と同じ値を入力してください。
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>} {/* メッセージ表示をここに移動 */}

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

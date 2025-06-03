// littlebuddha-dev/education/education-676d25275fadd678f043e2a225217161a768db69/src/app/setup/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [setupSecretKey, setSetupSecretKey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
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
          setIsDbConnected(false);
          setError(data.error || 'データベース接続に失敗しました。');
          setNeedsSetup(true); // DB接続自体ができていないので、セットアップが必要と判断
          return;
        }

        setIsDbConnected(true);
        const tables = data.tables.map(row => row.table_name);
        const usersTableFound = tables.includes('users'); //

        if (!usersTableFound) {
          // users テーブルが存在しない場合、セットアップが必要
          setNeedsSetup(true);
          setMessage('データベーステーブルが未作成です。システムを初期セットアップしてください。');
        } else {
          // users テーブルが存在する場合、管理者ユーザーの存在を確認
          let adminUserFound = false;
          try {
            // 管理者ユーザー一覧APIを叩いて、管理者ユーザーが存在するかどうかを確認
            // このAPIは管理者ロールでなければ403を返すため、ログインしていなければ基本アクセスできない
            // しかし、テーブルは存在しているので、管理者ユーザーがまだ登録されていない可能性をチェックする
            const adminCheckRes = await fetch('/api/admin/users', {
              // headersにAuthorizationを含めないことで、未認証状態でAPIを叩き、
              // 403が返ることを期待して管理者ユーザーが存在しないことを確認する
              // ただし、もし認証済みの非管理者ユーザーがいた場合も403が返るため、
              // 厳密には管理者ユーザーが存在しないことの証明にはならないが、
              // このセットアップフローにおいては十分なヒューリスティック
            });

            if (adminCheckRes.ok) {
              // 認証済み管理者ユーザーとしてAPIにアクセスできた場合
              const adminUsers = await adminCheckRes.json();
              adminUserFound = adminUsers.some(user => user.role === 'admin'); //
            } else if (adminCheckRes.status === 403) {
              // 権限がない（未ログインまたは非管理者）ためアクセス拒否された場合
              // この場合、管理者ユーザーがまだ登録されていない可能性がある
              adminUserFound = false;
            } else {
              // その他のエラー (例: 500エラーなど)
              const errorData = await adminCheckRes.json();
              setError(errorData.error || '管理者ユーザーの存在確認中に予期せぬエラーが発生しました。');
              setNeedsSetup(true); // エラーが発生した場合はセットアップが必要と判断
              return;
            }
          } catch (adminCheckError) {
            console.error('Failed to check admin user existence:', adminCheckError);
            setError('管理者ユーザーの存在確認に失敗しました。');
            setNeedsSetup(true); // エラーが発生した場合はセットアップが必要と判断
            return;
          }

          if (!adminUserFound) {
            // users テーブルは存在するが、管理者ユーザーがまだ登録されていない場合
            setNeedsSetup(true);
            setMessage('データベースは存在しますが、管理者ユーザーが未作成のようです。管理者ユーザーを作成してください。');
          } else {
            // users テーブルも管理者ユーザーも存在する場合、セットアップは完了済み
            setNeedsSetup(false);
          }
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
  }, [router]); // router の変更時にも再実行

  // needsSetup の状態に基づいてリダイレクトを行うuseEffect
  useEffect(() => {
    // ロードが終わって、isDbConnectedがtrue（DB接続OK）かつneedsSetupがfalse（セットアップ不要）であればログインページへリダイレクト
    if (!isLoading && isDbConnected && !needsSetup) {
      console.log('Setup page: Users table and admin user exist. Redirecting to login.');
      router.replace('/login');
    }
  }, [isLoading, isDbConnected, needsSetup, router]);

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
          'x-setup-secret-key': setupSecretKey,
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
    return (
      <main style={{ padding: '2rem' }}>
        <p>セットアップ状況を確認中...</p>
      </main>
    );
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

  // ここに到達する場合、needsSetup は true になっているはず
  // つまり、データベースは接続可能だが、usersテーブルがないか、管理者ユーザーがいない状態
  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>🔰 教育AIシステム 初期セットアップ</h1>
      <p>
        {message || 'システムはまだセットアップされていません。以下のフォームで初期設定を行ってください。'}
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

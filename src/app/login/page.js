// src/app/login/page.js
// タイトル: ログインページ (Context対応・堅牢化版)
// 役割: ログイン処理を行い、認証状態をグローバルに更新します。
//       認証済みユーザーのリダイレクトや、デバッグログの機能が追加されています。

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // useAuthフックをインポート
import { jwtDecode } from 'jwt-decode'; // [追加] jwt-decodeをインポート

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useAuth(); // [修正] isAuthenticatedとuserも取得

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // [追加] 認証済みのユーザーがログインページにアクセスした場合、適切なページにリダイレクトする
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('ログイン済みのためリダイレクトします。');
      const DASHBOARD_PATHS = {
        admin: '/admin/users',
        parent: '/children',
        child: '/chat',
      };
      const dashboardPath = DASHBOARD_PATHS[user.role] || '/';
      router.replace(dashboardPath);
    }
  }, [isAuthenticated, user, router]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // [追加] 送信するデータをコンソールで確認
    console.log(`ログイン試行: email=${email}`);

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // Contextのlogin関数を呼び出してグローバルな状態を更新
        login(data.token);

        // [修正] ログイン成功後のリダイレクト先を役割ベースで決定
        const decoded = jwtDecode(data.token);
        const DASHBOARD_PATHS = {
          admin: '/admin/users',
          parent: '/children',
          child: '/chat',
        };
        const redirectTo = searchParams.get('redirectTo');
        const targetPath = redirectTo || DASHBOARD_PATHS[decoded.role] || '/';
        
        router.push(targetPath);
        
      } else {
        // APIからのエラーメッセージを表示
        setError(data.error || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error('ログイン処理中に予期せぬエラー:', err);
      setError('通信エラーが発生しました。サーバーの状態を確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  // 認証済みの場合、リダイレクトが完了するまで何も表示しない
  if (isAuthenticated) {
    return null;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1>ログイン</h1>
      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', border: '1px solid red', borderRadius: '4px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>メールアドレス:
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>パスワード:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
          </label>
        </div>
        <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.5rem' }}>
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <div style={{ marginTop: '1rem' }}>
        <a href="/users/register">アカウントをお持ちでない方はこちら</a>
      </div>
    </main>
  );
}

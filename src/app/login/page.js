// src/app/login/page.js
// タイトル: ログインページ（強制リロード版）
// 役割: ログイン成功後、ページをフルリロードして状態の不整合を解消する。
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 【最重要修正点】認証状態がtrueになったら、ページをフルリロードしてリダイレクト
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const redirectTo = searchParams.get('redirectTo');
      const DASHBOARD_PATHS = {
        admin: '/admin/users',
        parent: '/children',
        child: '/chat',
      };
      const defaultPath = DASHBOARD_PATHS[user.role] || '/';
      const targetPath = redirectTo || defaultPath;
      
      // router.replaceの代わりにwindow.location.hrefを使い、ページを強制的に再読み込みさせる
      window.location.href = targetPath;
    }
  }, [isAuthenticated, user, authLoading, searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ログインに失敗しました');
      if (!data.token) throw new Error('認証トークンが取得できませんでした');
      
      // AuthContextの状態を更新する（この後のリロードで再構築されるが、念のため）
      await login(data.token, data.user);

    } catch (err) {
      console.error('ログインエラー:', err);
      setError(err.message);
      setIsSubmitting(false);
    }
  };
  
  // 認証チェック中やリダイレクト待機中はローディング表示
  if (authLoading || isAuthenticated) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p>認証状態を確認中...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>ログイン</h1>
      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', border: '1px solid red', borderRadius: '4px', backgroundColor: '#ffebee' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>メールアドレス:</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>パスワード:</label>
          <input type="password" name="password" value={formData.password} onChange={handleInputChange} required disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
        </div>
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', backgroundColor: isSubmitting ? '#ccc' : '#0070f3', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a href="/users/register" style={{ color: '#0070f3', textDecoration: 'none' }}>アカウントをお持ちでない方はこちら</a>
      </div>
    </main>
  );
}
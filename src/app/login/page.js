// src/app/login/page.js
// 修正版：遅延付きのrouter.pushでリダイレクト
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { setAuthCookie } from '@/utils/authUtils';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const DASHBOARD_PATHS = {
        admin: '/admin/users',
        parent: '/children',
        child: '/chat',
      };
      const defaultPath = DASHBOARD_PATHS[user.role] || '/';
      router.replace(defaultPath);
    }
  }, [isAuthenticated, user, authLoading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードを入力してください');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ログインに失敗しました');
      if (!data.token) throw new Error('認証トークンが取得できませんでした');
      
      // Cookie設定はAPIのSet-Cookieに任せる
      await login(data.token, data.user);
      
      console.log('ログイン成功、遅延後にリダイレクトします...');
      
      const DASHBOARD_PATHS = {
        admin: '/admin/users',
        parent: '/children',
        child: '/chat',
      };
      const redirectTo = searchParams.get('redirectTo');
      const defaultPath = DASHBOARD_PATHS[data.user.role] || '/';
      const targetPath = redirectTo || defaultPath;
      
      // 🔧 修正: router.push を使い、100msの遅延を設けてCookie同期の問題を回避
      setTimeout(() => {
        router.push(targetPath);
      }, 100);

    } catch (err) {
      console.error('ログインエラー:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // (以降のreturn文は変更なし)
  if (authLoading || (isAuthenticated && user)) {
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
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={isLoading} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>パスワード:</label>
          <input type="password" name="password" value={formData.password} onChange={handleInputChange} required disabled={isLoading} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
        </div>
        <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.75rem', backgroundColor: isLoading ? '#ccc' : '#0070f3', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a href="/users/register" style={{ color: '#0070f3', textDecoration: 'none' }}>アカウントをお持ちでない方はこちら</a>
      </div>
    </main>
  );
}
// src/components/Navbar.js
// タイトル: ナビゲーションバー (Context対応版)
// 役割: [修正] 独自の認証状態管理を廃止し、AuthContextから最新のユーザー情報を取得して表示します。

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // [修正] useAuthフックをインポート

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth(); // [修正] Contextから状態と関数を取得
  const [childProfileId, setChildProfileId] = useState(null);

  // 子ども自身のプロフィールIDを取得するロジックは、ユーザー情報が変化した時に実行
  useEffect(() => {
    if (user && user.role === 'child') {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (token) {
        fetch(`/api/children?child_user_id=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setChildProfileId(data[0].id);
          }
        })
        .catch(err => console.error('Navbar: 子どもプロフィール取得エラー:', err));
      }
    }
  }, [user]); // [修正] userオブジェクトの変更を検知

  const handleLogout = () => {
    logout(); // [修正] Contextのlogout関数を呼び出す
    router.push('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f0f0f0',
      padding: '1rem',
      borderBottom: '1px solid #ddd'
    }}>
      <div><a href="/">🏠 教育AIシステム</a></div>

      {isAuthenticated ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>
            👤 {user.last_name} {user.first_name} さん ({user.role})
          </span>

          {user.role === 'admin' && <a href="/admin/users">全ユーザー管理</a>}
          {user.role === 'parent' && (
            <>
              <a href="/children">子ども一覧</a>
              <a href="/children/register">子ども登録</a>
            </>
          )}
          {user.role === 'child' && (
            <>
              <a href="/chat">チャット</a>
              {childProfileId && <a href={`/children/${childProfileId}`}>学習状況</a>}
            </>
          )}

          <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>ログアウト</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/login">
            <button>ログイン</button>
          </a>
          <a href="/users/register" style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            新規登録
          </a>
        </div>
      )}
    </nav>
  );
}

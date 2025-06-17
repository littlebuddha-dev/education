// src/app/admin/users/page.js
// タイトル: 管理者向けユーザー管理ページ（認証ロジック修正版）
// 役割: システムに登録されている全ユーザーの管理を行います。
//       [修正] useAuthGuardからuseAuthに変更し、Contextから直接認証状態を取得するように修正しました。

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // [修正] useAuthGuardからuseAuthに変更

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth(); // [修正] useAuthから状態を取得
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    // 認証状態の読み込みが完了するまで待つ
    if (isAuthLoading) {
      return;
    }

    // 認証されていない、またはロールがadminでない場合はエラー表示
    if (!isAuthenticated || !user || user.role !== 'admin') {
      setError('アクセス権限がありません。このページは管理者専用です。');
      // 必要であればログインページにリダイレクト
      // setTimeout(() => router.replace('/login'), 2000);
      return;
    }

    // 認証情報（トークン）を取得してユーザー一覧をフェッチ
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (token) {
      fetchUsers(token);
    } else {
      setError("認証トークンが見つかりません。再ログインしてください。");
    }
  }, [isAuthenticated, user, isAuthLoading, router]);

  const fetchUsers = async (token) => {
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ユーザー一覧の取得に失敗しました');
      }
      setUsers(data);
    } catch (err) {
      console.error('管理者ユーザー一覧取得エラー:', err);
      setError(err.message);
    }
  };

  const toggleSelect = (id) => {
    if (user && id === user.id) {
        alert("管理者自身を削除対象に含めることはできません。");
        return;
    }
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    // ... (削除ロジックは変更なし)
  };

  // 認証情報の読み込み中はローディング表示
  if (isAuthLoading) {
    return <main style={{ padding: '2rem' }}><p>認証情報を確認中...</p></main>;
  }

  // エラーがある場合はエラーメッセージを表示
  if (error) {
    return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  }
  
  // 正常にレンダリング
  return (
    <main style={{ padding: '2rem' }}>
      <h1>管理者 - ユーザー管理</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => router.push('/users/register')} style={{ marginRight: '1rem' }}>
          新規ユーザー登録
        </button>
        {selectedIds.length > 0 && (
          <button onClick={deleteSelected} style={{ backgroundColor: 'red', color: 'white' }}>
            選択したユーザーを削除 ({selectedIds.length})
          </button>
        )}
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>選択</th>
            <th style={{fontSize: '0.8em'}}>ID</th>
            <th>Email</th>
            <th>姓</th>
            <th>名</th>
            <th>役割</th>
            <th>登録日</th>
            <th>子どもの数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u.id)}
                  onChange={() => toggleSelect(u.id)}
                  disabled={user && u.id === user.id}
                />
              </td>
              <td style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.first_name || '-'}</td>
              <td>{u.last_name || '-'}</td>
              <td>{u.role}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td style={{textAlign: 'center'}}>{u.children_count || 0}</td>
              <td>
                {u.role === 'parent' || (u.role === 'child' && (u.children_count || 0) > 0) ? (
                   <button onClick={() => router.push(`/admin/users/skills?id=${u.id}`)}>
                     スキル統計
                   </button>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

// src/app/admin/users/page.js
// 修正版：ページ内の認証ロジックを削除
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// useAuthは不要になったため削除

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // データ取得ロジックは変更なし
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー一覧の取得に失敗しました');
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 認証チェックを削除し、データ取得のみを行うシンプルなuseEffectに変更
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return <div style={{padding: '2rem'}}>ユーザー情報を読み込み中...</div>;
  }
  
  if (error) {
    return (
      <div style={{padding: '2rem'}}>
        <h1>管理者 - ユーザー管理</h1>
        <div style={{color: 'red', padding: '1rem', border: '1px solid red', marginTop: '1rem'}}>
          ❌ {error}
        </div>
      </div>
    );
  }

  // (以降のreturn文は変更なし)
  return (
    <div style={{padding: '2rem'}}>
      <h1>管理者 - ユーザー管理</h1>
      <button onClick={fetchUsers} disabled={loading} style={{marginBottom: '1rem'}}>更新</button>
      <div>
        <p>ユーザー数: {users.length}</p>
        <table border="1" style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr>
              <th style={{padding: '8px'}}>Email</th>
              <th style={{padding: '8px'}}>名前</th>
              <th style={{padding: '8px'}}>役割</th>
              <th style={{padding: '8px'}}>登録日</th>
              <th style={{padding: '8px'}}>子どもの数</th>
              <th style={{padding: '8px'}}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{padding: '8px'}}>{u.email}</td>
                <td style={{padding: '8px'}}>{u.first_name} {u.last_name}</td>
                <td style={{padding: '8px'}}>{u.role}</td>
                <td style={{padding: '8px'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{padding: '8px', textAlign: 'center'}}>{u.children_count || 0}</td>
                <td style={{padding: '8px'}}>
                  <button onClick={() => router.push(`/admin/users/skills?id=${u.id}`)} style={{ padding: '4px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                    📊 スキル統計
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
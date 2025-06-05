// src/app/admin/users/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { removeAuthCookie } from '@/utils/authUtils';

export default function AdminUsersPage() {
  const { ready, userRole, authToken, tokenInfo } = useAuthGuard();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!ready) return;

    if (userRole !== 'admin') {
      setError('アクセス権限がありません。このページは管理者専用です。');
      // router.replace('/login'); // 必要に応じてリダイレクト
      return;
    }

    if (authToken) {
      fetchUsers(authToken);
    } else {
      setError("認証トークンがありません。ログインし直してください。");
      removeAuthCookie();
      router.push('/login');
    }
  }, [ready, userRole, authToken, router]);

  const fetchUsers = async (token) => {
    setError('');
    try {
      const res = await fetch('/api/admin/users', { // 管理者用APIエンドポイント
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
    // 管理者自身は削除対象に含めない
    if (tokenInfo && id === tokenInfo.id) {
        alert("管理者自身を削除対象に含めることはできません。");
        return;
    }
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (!authToken) {
        setError("認証トークンがありません。");
        return;
    }
    if (selectedIds.length === 0) {
        setError("削除するユーザーを選択してください。");
        return;
    }
    if (!confirm(`${selectedIds.length}件のユーザーを本当に削除しますか？この操作は取り消せません。`)) return;

    setError('');
    let deleteCount = 0;
    const failedDeletes = [];
    try {
        for (const id of selectedIds) {
            // 管理者自身を削除しようとしていないか再度確認（UIでdisabledにしているが念のため）
            if (tokenInfo && id === tokenInfo.id) {
                failedDeletes.push({id, error: "管理者自身は削除できません。"});
                continue;
            }
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!res.ok) {
                const errData = await res.json();
                failedDeletes.push({id, error: errData.error || res.statusText});
            } else {
                deleteCount++;
            }
        }
        
        let message = "";
        if (deleteCount > 0) {
            message += `${deleteCount}件のユーザーを削除しました。\n`;
        }
        if (failedDeletes.length > 0) {
            message += `以下のユーザーの削除に失敗しました:\n${failedDeletes.map(f => `ID ${f.id}: ${f.error}`).join('\n')}`;
            setError(message); // エラーメッセージとして表示
        } else if (deleteCount > 0) {
            alert(message); // 成功時のみアラート
        }


        setSelectedIds([]);
        fetchUsers(authToken);
    } catch (err) {
        console.error('ユーザー削除処理中にエラー:', err);
        setError(err.message || "ユーザー削除中に予期せぬエラーが発生しました。");
        fetchUsers(authToken); // リストを再読み込み
    }
  };

  if (!ready) return <main style={{ padding: '2rem' }}><p>読み込み中...</p></main>;
  if (userRole !== 'admin') return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error || 'アクセス権限がありません。'}</p></main>;
  if (error && users.length === 0) return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main>;


  return (
    <main style={{ padding: '2rem' }}>
      <h1>管理者 - ユーザー管理</h1>
      
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => router.push('/users/register')} style={{ marginRight: '1rem', padding: '0.5em 1em' }}>
          新規ユーザー登録
        </button>
        {selectedIds.length > 0 && (
          <button
            onClick={deleteSelected}
            style={{ backgroundColor: 'red', color: 'white', padding: '0.5em 1em', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            選択したユーザーを削除 ({selectedIds.length})
          </button>
        )}
      </div>

      {users.length === 0 && !error && <p>登録ユーザーはいません。</p>}

      {users.length > 0 && (
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
              <th>子ども</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    disabled={user.role === 'admin' && tokenInfo && user.id === tokenInfo.id} // 管理者自身は選択不可
                  />
                </td>
                <td style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.first_name || '-'}</td>
                <td>{user.last_name || '-'}</td>
                <td>{user.role}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={{textAlign: 'center'}}>{user.children_count || 0}</td>
                <td style={{fontSize: '0.9em'}}>
                  {user.children && user.children.length > 0
                    ? user.children.map(c => c.name).join(', ')
                    : '-'}
                </td>
                <td>
                  {user.role === 'parent' || (user.role === 'child' && user.children_count > 0) ? (
                     <button 
                        onClick={() => router.push(`/admin/users/skills?id=${user.id}`)}
                        style={{fontSize: '0.9em', padding: '0.3em 0.6em'}}
                      >
                       スキル統計
                     </button>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/app/users/page.js
'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { getCookie } from '@/utils/authUtils'; // getCookie は不要に

export default function UsersPage() {
  const { ready, userRole, authToken } = useAuthGuard(); // ✅ authToken を取得
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!ready || userRole === null || !authToken) { // ✅ authToken もチェック
      return;
    }

    // /api/users は管理者のみがアクセスできるため、このページも管理者限定とみなす
    if (userRole !== 'admin') {
      setErrorMessage('⚠️ このページは管理者のみアクセス可能です');
      return;
    }

    fetchUsers(authToken); // ✅ authToken を引数として渡す
  }, [ready, userRole, authToken]); // ✅ authToken を依存関係に追加

  const fetchUsers = async (token) => {
    try {
      // Note: /api/users GET は admin 専用として残っているが、DELETE がないため、
      // DELETE は /api/admin/users にある機能を利用する
      // このページは /api/admin/users を叩くように変更する
      const res = await fetch('/api/admin/users', { // ✅ 変更: /api/admin/users を叩く
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ユーザー一覧の取得に失敗しました');
      }
      setUsers(data);
      setErrorMessage('');
    } catch (err) {
      console.error('ユーザー一覧取得エラー:', err);
      setErrorMessage(err.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (!confirm('選択されたユーザーを本当に削除しますか？')) return;

    if (!authToken) { // ✅ authToken をチェック
      alert('ログイン情報がありません。');
      return;
    }

    for (const id of selectedIds) {
      // DELETE 処理は /api/admin/users/[id] に移動済みのため、そちらを呼び出す
      await fetch(`/api/admin/users/${id}`, { // ✅ 変更: /api/admin/users/${id} を叩く
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // ✅ authToken を使用
        }
      });
    }

    setSelectedIds([]);
    fetchUsers(authToken); // ✅ authToken を引数として渡す
  };

  if (!ready) {
    return (
      <main style={{ padding: '2rem' }}>
        <p>認証状態を確認中...</p>
      </main>
    );
  }

  // ロールが管理者でなければエラーメッセージを表示
  if (userRole !== 'admin') {
      return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{errorMessage || 'アクセス権限がありません。'}</p></main>;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>ユーザー一覧</h1>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => router.push('/users/register')}>
          新規登録
        </button>
        {selectedIds.length > 0 && (
          <button onClick={deleteSelected} style={{ marginLeft: '1rem', background: 'red', color: 'white' }}>
            削除（{selectedIds.length}件）
          </button>
        )}
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>選択</th>
            <th>姓</th>
            <th>名</th>
            <th>メール</th>
            <th>作成日</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => toggleSelect(user.id)}
                />
              </td>
              <td>{user.last_name || '（未設定）'}</td>
              <td>{user.first_name || '（未設定）'}</td>
              <td>{user.email}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

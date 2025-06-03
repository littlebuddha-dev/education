'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  useAuthGuard(); // ✅ 未ログインなら /login に強制遷移

  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (!confirm('選択されたユーザーを本当に削除しますか？')) return;

    for (const id of selectedIds) {
      await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    }

    setSelectedIds([]);
    fetchUsers();
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>ユーザー一覧</h1>

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

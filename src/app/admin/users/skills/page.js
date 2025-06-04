// src/app/admin/users/skills/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '@/utils/authUtils';

export default function UserSkillsPage() {
  const params = useParams(); // 親ユーザーID
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) {
      router.push('/login');
      return;
    }

    const decoded = jwtDecode(token);
    setTokenInfo(decoded);

    if (decoded.role !== 'admin') {
      setError('⚠️ 管理者のみ閲覧可能です');
      return;
    }

    fetch(`/api/admin/users/${params.id}/skills`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => {
        console.error('Fetch error:', err.message);
        setError('統計データの取得に失敗しました');
      });
  }, [params.id, router]);

  const groupByChild = stats.reduce((acc, row) => {
    acc[row.child_name] = acc[row.child_name] || [];
    acc[row.child_name].push(row);
    return acc;
  }, {});

  // ✅ Cookie から値を取り出す関数 (ChatUI からコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>スキル統計（親ユーザー: {params.id}）</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && Object.keys(groupByChild).length === 0 && (
        <p>統計データはまだありません。</p>
      )}

      {Object.entries(groupByChild).map(([childName, logs]) => (
        <section key={childName} style={{ marginBottom: '2rem' }}>
          <h3>{childName}</h3>
          <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>分野</th>
                <th>平均スコア</th>
                <th>件数</th>
                <th>最終記録日</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.domain}>
                  <td>{log.domain}</td>
                  <td>{log.avg_score}</td>
                  <td>{log.entry_count}</td>
                  <td>{new Date(log.last_recorded).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}

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

  // Debug log for params outside useEffect (initial render)
  console.log('🐞 AdminSkillsPage: Initial params:', params); // 💡 追加

  useEffect(() => {
    // Debug log for params inside useEffect
    console.log('🐞 AdminSkillsPage: useEffect params:', params); // 💡 追加

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

    // Only proceed if params.id is available
    if (params.id) { // 💡 修正: params.id が undefined でないことを確認
      fetch(`/api/admin/users/${params.id}/skills`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '取得エラー');
          }
          return res.json();
        })
        .then(data => setStats(data))
        .catch(err => {
          console.error('Fetch error:', err.message);
          setError(err.message);
        });
    } else {
      setError('ユーザーIDが見つかりませんでした。'); // 💡 エラーメッセージを追加
    }
  }, [params.id, router]); // params.id を依存配列に含める

  const groupByChild = stats.reduce((acc, row) => {
    acc[row.child_name] = acc[row.child_name] || [];
    acc[row.child_name].push(row);
    return acc;
  }, {});

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>スキル統計（親ユーザー: {params.id || 'N/A'}）</h1> {/* 💡 params.id が undefined の場合の表示 */}
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
                  <td>{new Date(log.last_recorded).toISOString().split('T')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}

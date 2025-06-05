// src/app/admin/users/skills/page.js
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCookie, removeAuthCookie } from '@/utils/authUtils';

export default function AdminUserSkillsStatsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUserId = searchParams.get('id'); // クエリパラメータ 'id' から対象ユーザーIDを取得

  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');
  const [targetUserName, setTargetUserName] = useState('');

  useEffect(() => {
    console.log('🐞 AdminUserSkillsStatsPage: useEffect triggered. targetUserId:', targetUserId);

    const token = getCookie('token');
    if (!token) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (err) {
      setError('無効な認証トークンです。');
      removeAuthCookie();
      router.push('/login');
      return;
    }

    if (decoded.role !== 'admin') {
      setError('⚠️ 管理者のみ閲覧可能です');
      return;
    }

    if (!targetUserId) {
      setError('対象のユーザーIDが指定されていません。');
      return;
    }
    
    // 対象ユーザーの情報を取得して表示する（任意）
    // APIを叩いてユーザー名などを取得しても良い
    // ここでは一旦IDのみ表示
    setTargetUserName(`ユーザーID: ${targetUserId}`);


    fetch(`/api/admin/users/${targetUserId}/skills`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || '統計データの取得エラー');
        }
        return res.json();
      })
      .then(data => {
        if (data.length > 0 && data[0].child_name) { // ユーザー名も取得できれば表示する
            const firstChildName = data[0].child_name;
            // このAPIは子どもの名前ごとに統計を返すので、対象ユーザー自身の名前ではない
            // より正確なユーザー名表示のためには、別途ユーザー情報を取得するAPIが必要
            // setTargetUserName(`${data[0].child_name} (保護者ID: ${targetUserId})`);
        }
        setStats(data);
        setError('');
      })
      .catch(err => {
        console.error('Fetch error for user skills stats:', err.message);
        setError(err.message);
      });
  }, [targetUserId, router]);

  const groupByChild = stats.reduce((acc, row) => {
    const childKey = row.child_name || `子ども (ID: ${row.child_id})`; // 子ども名がない場合のフォールバック
    acc[childKey] = acc[childKey] || [];
    acc[childKey].push(row);
    return acc;
  }, {});

  return (
    <main style={{ padding: '2rem' }}>
      <h1>スキル統計（対象: {targetUserName || 'N/A'}）</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!error && Object.keys(groupByChild).length === 0 && (
        <p>このユーザーの子どもに関する統計データはまだありません。</p>
      )}

      {Object.entries(groupByChild).map(([childName, logs]) => (
        <section key={childName} style={{ marginBottom: '2rem' }}>
          <h3>{childName}</h3>
          {logs.length > 0 ? (
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
                  <tr key={`${childName}-${log.domain}`}>
                    <td>{log.domain}</td>
                    <td>{log.avg_score}</td>
                    <td>{log.entry_count}</td>
                    <td>{new Date(log.last_recorded).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>この子どものスキルログはありません。</p>
          )}
        </section>
      ))}
      <button onClick={() => router.back()} style={{ marginTop: '1rem' }}>戻る</button>
    </main>
  );
}

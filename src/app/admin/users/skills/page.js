// /src/app/admin/users/skills/page.js
// 役割: 管理者向けスキル統計ページ。データ取得をapiClientに統一する。
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/apiClient'; // ✅ apiClientをインポート

export default function AdminUserSkillsStatsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');
  const [targetUserName, setTargetUserName] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    // 認証状態が確定するまで待機
    if (isAuthLoading) {
      return;
    }

    // 未認証または管理者でない場合はリダイレクト
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/login');
      return;
    }

    const targetUserId = searchParams.get('id');
    if (!targetUserId) {
      setError('対象のユーザーIDが指定されていません。');
      setIsFetching(false);
      return;
    }

    setTargetUserName(`ユーザーID: ${targetUserId}`);

    // ✅【修正】古いfetchを、トークン自動リフレッシュ機能付きのapiClientに置き換えます
    apiClient(`/api/admin/users/${targetUserId}/skills`)
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'エラーレスポンスの解析に失敗しました' }));
          throw new Error(errData.error || `エラー: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setStats(data);
        setError('');
      })
      .catch(err => {
        console.error('スキル統計の取得エラー:', err.message);
        setError(err.message);
      })
      .finally(() => {
        setIsFetching(false);
      });
      
  }, [isAuthLoading, isAuthenticated, user, router, searchParams]);

  if (isAuthLoading || isFetching) {
    return <main style={{ padding: '2rem' }}><p>統計データを読み込み中...</p></main>;
  }

  // 子どもごとに統計をグループ化
  const groupByChild = stats.reduce((acc, row) => {
    const childKey = row.child_name || `子ども (ID: ${row.child_id})`;
    if (!acc[childKey]) {
      acc[childKey] = [];
    }
    acc[childKey].push(row);
    return acc;
  }, {});

  return (
    <main style={{ padding: '2rem' }}>
      <h1>スキル統計（対象: {targetUserName || 'N/A'}）</h1>
      {error && <p style={{ color: 'red' }}>{`エラー: ${error}`}</p>}

      {!error && Object.keys(groupByChild).length === 0 && !isFetching && (
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
// littlebuddha-dev/education/education-main/src/app/children/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SkillLogForm from '@/components/SkillLogForm';

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params.id;

  const [child, setChild] = useState(null);
  const [skillLogs, setSkillLogs] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]); // ✅ 追加: 学習進捗
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('ログインしていません。');
      return;
    }

    // 子ども情報を取得
    fetch(`/api/children?id=${childId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(async res => {
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '子ども情報の取得に失敗しました');
        }
        return res.json();
    })
    .then(data => {
        const foundChild = data.find(c => c.id === childId);
        if (foundChild) {
            setChild(foundChild);
        } else {
            setError('子どもが見つかりませんでした。');
        }
    })
    .catch(err => {
        console.error('Fetch child error:', err.message);
        setError(err.message);
    });

    fetchSkills();
    fetchLearningProgress(); // ✅ 追加: 学習進捗の取得
  }, [childId]);

  const fetchSkills = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`/api/children/${childId}/skills`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'スキルログの取得に失敗しました');
        }
        return res.json();
      })
      .then(setSkillLogs)
      .catch(err => {
        console.error('Fetch skill logs error:', err.message);
        setError(err.message);
      });
  };

  // ✅ 追加: 学習進捗を取得する関数
  const fetchLearningProgress = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`/api/children/${childId}/learning-progress`, { // 新しいAPIエンドポイントを想定
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '学習進捗の取得に失敗しました');
        }
        return res.json();
      })
      .then(setLearningProgress)
      .catch(err => {
        console.error('Fetch learning progress error:', err.message);
        setError(err.message);
      });
  };


  if (error) return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!child) return <main style={{ padding: '2rem' }}><p>読み込み中...</p></main>;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{child.name} さんの学習履歴</h1>
      <p>誕生日: {child.birthday}</p>
      <p>性別: {child.gender}</p>

      <h2 style={{ marginTop: '2rem' }}>スキルログ</h2>
      {skillLogs.length === 0 ? (
        <p>スキルログがまだ登録されていません。</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>分野</th>
              <th>スコア</th>
              <th>記録日時</th>
            </tr>
          </thead>
          <tbody>
            {skillLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.domain}</td>
                <td>{log.score}</td>
                <td>{new Date(log.recorded_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ 追加: 学習進捗の表示セクション */}
      <h2 style={{ marginTop: '2rem' }}>学習進捗</h2>
      {learningProgress.length === 0 ? (
        <p>学習目標がまだ設定されていないか、進捗データがありません。</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>目標名</th>
              <th>教科</th>
              <th>分野</th>
              <th>ステータス</th>
              <th>達成日</th>
            </tr>
          </thead>
          <tbody>
            {learningProgress.map((lp) => (
              <tr key={lp.id}>
                <td>{lp.goal_name}</td>
                <td>{lp.subject}</td>
                <td>{lp.domain}</td>
                <td>{lp.status}</td>
                <td>{lp.achieved_at ? new Date(lp.achieved_at).toLocaleDateString() : '未達成'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      <SkillLogForm childId={childId} onSuccess={fetchSkills} />
    </main>
  );
}

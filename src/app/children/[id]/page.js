// src/app/children/[id]/page.js
'use client'; // ✅ クライアントコンポーネントに指定

import { useEffect, useState } from 'react'; // ✅ useState, useEffect をインポート
import { useParams } from 'next/navigation'; // ✅ useParams をインポート
import SkillLogForm from '@/components/SkillLogForm'; // ✅ SkillLogForm をインポート

export default function ChildDetailPage() { // ✅ async/await を削除し、クライアントコンポーネント化
  const params = useParams(); // URLパラメータからidを取得
  const childId = params.id; // 子どもID

  const [child, setChild] = useState(null); // 子ども情報
  const [skillLogs, setSkillLogs] = useState([]); // スキルログ
  const [error, setError] = useState(''); // エラーメッセージ

  // 子ども情報とスキルログの取得
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('ログインしていません。');
      return;
    }

    // 子ども情報を取得
    // ここでは /api/children を利用し、idでフィルタリングしています。
    // もし /api/children/[id] のような単一の子どもを取得するAPIを作成した場合は、そちらを使用してください。
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
        // /api/children が配列を返すため、該当する子どもを探す
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

    // スキルログの取得
    fetchSkills();
  }, [childId]); // childId が変更されたら再実行

  const fetchSkills = () => { // スキルログ再読み込み用関数
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

  // エラーがある場合、エラーメッセージを表示
  if (error) return <main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  // 子ども情報がまだ読み込まれていない場合、ローディングメッセージを表示
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
              <tr key={log.id}> {/* 各ログにはユニークなIDがあることを前提 */}
                <td>{log.domain}</td>
                <td>{log.score}</td>
                <td>{new Date(log.recorded_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* SkillLogForm をここに配置し、childId を props として渡す */}
      {/* 新しいスキルログが追加されたら、fetchSkillsを呼び出してリストを更新 */}
      <SkillLogForm childId={childId} onSuccess={fetchSkills} />
    </main>
  );
}

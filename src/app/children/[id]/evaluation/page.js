'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ChildEvaluationPage() {
  const { id } = useParams(); // 子どもIDを取得
  const [evaluations, setEvaluations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/children/${id}/evaluations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg);
        }
        return res.json();
      })
      .then(data => setEvaluations(data))
      .catch(err => {
        console.error('評価取得エラー:', err.message);
        setError(err.message);
      });
  }, [id]);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>スキル評価一覧</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {evaluations.length === 0 && <p>まだ評価が記録されていません。</p>}

      {evaluations.length > 0 && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>教科</th>
              <th>分野</th>
              <th>レベル</th>
              <th>理由</th>
              <th>学習方針</th>
              <th>記録日</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((e, i) => (
              <tr key={i}>
                <td>{e.subject}</td>
                <td>{e.domain}</td>
                <td>{e.level}</td>
                <td>{e.reason}</td>
                <td>{e.recommendation}</td>
                <td>{new Date(e.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

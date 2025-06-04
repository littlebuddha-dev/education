// src/app/users/[id]/skills/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '@/utils/authUtils';

export default function UserSkillsPage() {
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const params = useParams();

  useEffect(() => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) return setError('ログインしてください');

    const decoded = jwtDecode(token);
    const userId = params.id;

    if (decoded.role !== 'admin' && decoded.id !== userId) {
      return setError('このページは他人には表示できません');
    }

    fetch(`/api/users/${userId}/skills`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(setSkills)
      .catch(err => {
        console.error('取得エラー:', err);
        setError('スキル情報の取得に失敗しました');
      });
  }, [params.id]);

  // ✅ Cookie から値を取り出す関数 (ChatUI からコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>スキル統計</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {skills.length > 0 ? (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>教科</th>
              <th>分野</th>
              <th>難易度</th>
              <th>スコア</th>
              <th>更新日</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((s, i) => (
              <tr key={i}>
                <td>{s.subject}</td>
                <td>{s.domain}</td>
                <td>{s.level}</td>
                <td>{s.score}</td>
                <td>{new Date(s.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !error && <p>スキルデータがまだありません。</p>
      )}
    </main>
  );
}

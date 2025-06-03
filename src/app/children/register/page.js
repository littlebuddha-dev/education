// src/app/children/register/page.js
'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

export default function ChildRegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role === 'parent') {
        setLastName(decoded.last_name); // 親の苗字を保存
      } else {
        setError('このページは保護者のみアクセスできます');
        // 子どもが誤ってアクセスした場合の対処
        router.replace('/chat'); // 例えばチャットページにリダイレクト
      }
    } catch {
      setError('無効なトークンです');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // const token = localStorage.getItem('token'); // ❌ 変更
    const token = getCookie('token'); // ✅ Cookieから取得
    const decoded = jwtDecode(token);

    if (decoded.role !== 'parent') { // 保護者以外は登録できないようにする
        setError('この操作は保護者のみ可能です');
        return;
    }

    const fullName = `${lastName} ${firstName}`;

    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fullName,
          gender,
          birthday,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      router.push('/children');
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ Cookie から値を取り出す関数 (ChatUI からコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1>子どもを登録する</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          名前：
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{lastName}</span> {/* 親の苗字を表示 */}
            <input
              type="text"
              placeholder="下の名前"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
            />
          </div>
        </label>


        <label>
          性別：
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            required
            style={{ display: 'block', margin: '0.5rem 0' }}
          >
            <option value="">選択してください</option>
            <option value="男の子">男の子</option>
            <option value="女の子">女の子</option>
            <option value="その他">その他</option>
          </select>
        </label>

        <label>
          誕生日：
          <input
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
            required
            style={{ display: 'block', margin: '0.5rem 0' }}
          />
        </label>

        <button type="submit" style={{ marginTop: '1rem' }}>
          登録する
        </button>
      </form>
    </main>
  );
}

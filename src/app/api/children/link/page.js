// littlebuddha-dev/education/education-main/src/app/children/link/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LinkChildPage() {
  const [childEmail, setChildEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLinkChild = async () => {
    setError('');
    setMessage('');

    if (!childEmail) {
      setError('子どものメールアドレスを入力してください。');
      return;
    }

    try {
      const token = localStorage.getItem('token'); // 保護者ユーザーのトークン
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/children/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ childEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setChildEmail('');
        // 成功後、子ども一覧ページにリダイレクトするなど
        router.push('/children');
      } else {
        setError(data.error || '子どもアカウントの紐付けに失敗しました。');
      }
    } catch (err) {
      console.error('紐付けエラー:', err);
      setError('エラーが発生しました。');
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1>子どもアカウントを紐付ける</h1>
      <p>お子様がすでにアカウントを作成している場合、ここで紐付けできます。</p>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <label>
          子どものメールアドレス：
          <input
            type="email"
            value={childEmail}
            onChange={(e) => setChildEmail(e.target.value)}
            placeholder="子どものアカウントのメールアドレス"
            required
          />
        </label>
      </div>

      <button onClick={handleLinkChild}>子どもアカウントを紐付ける</button>
    </main>
  );
}
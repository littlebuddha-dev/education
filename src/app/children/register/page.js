// src/app/children/register/page.js
// タイトル: 子ども登録ページ
// 役割: 保護者が新しい子どもをシステムに登録するためのフォーム画面です。

'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/utils/authUtils'; // [修正] 共通関数をインポート

export default function ChildRegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = getCookie('token'); // [修正] 共通関数を使用
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role === 'parent') {
        setLastName(decoded.last_name);
      } else {
        setError('このページは保護者のみアクセスできます');
        router.replace('/chat');
      }
    } catch {
      setError('無効なトークンです');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const token = getCookie('token'); // [修正] 共通関数を使用
    if (!token) {
        setError('認証情報が見つかりません。');
        return;
    }

    const decoded = jwtDecode(token);
    if (decoded.role !== 'parent') {
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

  // [削除] このファイル内にあったgetCookie関数は削除されました

  return (
    <main style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1>子どもを登録する</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* ...フォーム内容は変更なし... */}
      </form>
    </main>
  );
}
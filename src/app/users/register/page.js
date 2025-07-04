// littlebuddha-dev/education/education-main/src/app/users/register/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserRegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent'); // ✅ 追加: role の状態と初期値
  const [birthday, setBirthday] = useState(''); // ✅ 追加: birthday の状態
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleRegister = async () => {
    // 必須項目のチェックにbirthdayを追加
    if (!email || !password || !firstName || !lastName || !birthday) { // 💡 修正: birthday を必須項目に追加
      setError('すべての項目を入力してください');
      return;
    }

    try {
      // 1. ユーザー登録
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // body に birthday を追加
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName, role, birthday }), // 💡 修正: birthday を追加
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      // 2. 登録成功 → 自動ログイン（JWT発行）
      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();

      if (loginData.token) {
        document.cookie = `token=${loginData.token}; path=/; max-age=3600; SameSite=Lax`; // ✅ Cookie保存に変更（localStorage廃止の方向性）
        // 登録されたロールによってリダイレクト先を調整
        if (role === 'child') {
          router.push('/chat'); // 子供は直接チャットページへ
        } else {
          router.push('/users'); // 親はユーザー一覧などへ
        }
      } else {
        setError('ログインに失敗しました');
      }
    } catch (err) {
      console.error('登録中エラー:', err);
      setError('エラーが発生しました');
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>ユーザー登録</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          姓：
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          名：
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          メールアドレス：
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          パスワード：
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      </div>

      {/* ✅ 生年月日の入力フィールドを追加 */}
      <div style={{ marginBottom: '1rem' }}>
        <label>
          生年月日：
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required /> {/* 💡 追加 */}
        </label>
      </div>

      {/* ✅ ロールの選択を追加 */}
      <div style={{ marginBottom: '1rem' }}>
        <label>
          登録種別：
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.3rem' }}>
            <option value="parent">保護者</option>
            <option value="child">子ども</option>
          </select>
        </label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={handleRegister}>登録する</button>
    </main>
  );
}
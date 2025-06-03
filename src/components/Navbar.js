// littlebuddha-dev/education/education-main/src/components/Navbar.js
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function Navbar() {
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    // JWTがlocalStorageではなくCookieから取得されるように変更
    const token = getCookie('token'); // ✅ getCookie 関数を使用
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setTokenInfo(decoded); // { id, email, role, first_name, last_name }
      } catch (err) {
        // 無効なトークンの場合、Cookieを削除
        document.cookie = 'token=; Max-Age=0; path=/;'; // ✅ Cookie削除
        setTokenInfo(null);
      }
    }
  }, []);

  const handleLogout = () => {
    // localStorage の token を削除する代わりに Cookie を削除
    document.cookie = 'token=; Max-Age=0; path=/;'; // ✅ Cookie削除
    setTokenInfo(null);
    router.push('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  // ✅ getCookie 関数 (ChatUIからコピー)
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#eee',
      padding: '1rem'
    }}>
      <div><a href="/">🏠 教育AIシステム</a></div>

      {tokenInfo ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>
            👤 {tokenInfo.last_name} {tokenInfo.first_name} さん（{tokenInfo.role === 'child' ? '子ども' : tokenInfo.role}）
          </span>

          {/* ロールに応じたナビゲーション */}
          {tokenInfo.role === 'parent' && (
            <>
              <a href="/users">ユーザー</a>
              <a href="/children">子ども</a>
              <a href="/children/link">子ども紐付け</a> {/* ✅ 追加 */}
            </>
          )}

          {tokenInfo.role === 'child' && ( // ✅ child ロール用のリンク
            <>
              <a href="/chat">チャット</a>
              {/* 子どもが自身の学習履歴を見るページへのリンク（任意で作成） */}
              <a href={`/children/${tokenInfo.id}/skills`}>学習状況</a> {/* 仮のリンク、children.id に修正必要 */}
            </>
          )}

          {tokenInfo.role === 'admin' && (
            <>
              <a href="/admin/users">全ユーザー</a>
            </>
          )}

          <button onClick={handleLogout}>ログアウト</button>
        </div>
      ) : (
        <button onClick={handleLogin}>ログイン</button>
      )}
    </nav>
  );
}

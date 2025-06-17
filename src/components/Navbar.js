// src/components/Navbar.js
// 修正版：管理者向けにドロップダウンメニューを追加
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    logout, 
    isLoading, 
    error,
    getCurrentToken,
    isTokenValid 
  } = useAuth();
  
  const [childProfileId, setChildProfileId] = useState(null);
  const [isLoadingChild, setIsLoadingChild] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // ドロップダウンの開閉状態
  const dropdownRef = useRef(null); // ドロップダウンの参照

  // デバッグ情報の収集
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const collectDebugInfo = () => {
      const currentToken = getCurrentToken();
      const tokenIsValid = isTokenValid();
      
      setDebugInfo({
        contextUser: user,
        contextAuthenticated: isAuthenticated,
        contextLoading: isLoading,
        hasStoredToken: !!currentToken,
        storedTokenValid: tokenIsValid,
        tokenPreview: currentToken?.substring(0, 30) + '...' || 'なし',
        timestamp: new Date().toLocaleTimeString()
      });
    };

    collectDebugInfo();
    const interval = setInterval(collectDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [user, isAuthenticated, isLoading, getCurrentToken, isTokenValid]);

  // 子ども自身のプロフィールIDを取得
  useEffect(() => {
    if (!user || user.role !== 'child' || !isAuthenticated) {
      setChildProfileId(null);
      return;
    }

    const fetchChildProfile = async () => {
      setIsLoadingChild(true);
      try {
        const response = await fetch(`/api/children?child_user_id=${user.id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setChildProfileId(data[0].id);
          }
        } else {
          console.error('子どもプロフィール取得失敗:', response.status);
        }
      } catch (error) {
        console.error('子どもプロフィール取得エラー:', error);
      } finally {
        setIsLoadingChild(false);
      }
    };

    fetchChildProfile();
  }, [user, isAuthenticated]);
  
  // ドロップダウンの外側をクリックしたときに閉じる処理
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


  const handleLogout = () => {
    try {
      console.log('🚪 ログアウト実行中...');
      logout();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      router.push('/login');
    }
  };

  const renderAuthenticatedNav = () => {
    const displayName = user?.last_name && user?.first_name 
      ? `${user.last_name} ${user.first_name}` 
      : user?.email || 'Unknown User';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ 
          padding: '0.5rem', 
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          👤 {displayName} さん ({getRoleDisplayName(user?.role)})
        </span>

        {/* 🔧 修正: 管理者用ナビゲーションをドロップダウンに変更 */}
        {user?.role === 'admin' && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              style={{ ...navLinkStyle, cursor: 'pointer', userSelect: 'none' }}
            >
              機能メニュー ▼
            </button>
            {isDropdownOpen && (
              <div style={dropdownMenuStyle}>
                <a href="/admin/users" style={dropdownLinkStyle}>👥 ユーザー管理</a>
                <a href="/children" style={dropdownLinkStyle}>👶 子ども管理</a>
                <a href="/chat" style={dropdownLinkStyle}>💬 チャット</a>
              </div>
            )}
          </div>
        )}

        {/* 保護者用ナビゲーション */}
        {user?.role === 'parent' && (
          <>
            <a href="/children" style={navLinkStyle}>
              👶 子ども一覧
            </a>
            <a href="/children/register" style={navLinkStyle}>
              ➕ 子ども登録
            </a>
            <a href="/chat" style={navLinkStyle}>
              💬 チャット
            </a>
          </>
        )}

        {/* 子ども用ナビゲーション */}
        {user?.role === 'child' && (
          <>
            <a href="/chat" style={navLinkStyle}>
              💬 チャット
            </a>
            {childProfileId && !isLoadingChild ? (
              <a href={`/children/${childProfileId}`} style={navLinkStyle}>
                📊 学習状況
              </a>
            ) : isLoadingChild ? (
              <span style={{ fontSize: '0.8em', color: '#666' }}>読み込み中...</span>
            ) : null}
          </>
        )}

        <button 
          onClick={handleLogout}
          style={logoutButtonStyle}
        >
          ログアウト
        </button>
      </div>
    );
  };

  const renderUnauthenticatedNav = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <a href="/login">
        <button style={loginButtonStyle}>
          ログイン
        </button>
      </a>
      <a 
        href="/users/register" 
        style={registerLinkStyle}
      >
        新規登録
      </a>
    </div>
  );

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: '管理者',
      parent: '保護者',
      child: '子ども',
    };
    return roleNames[role] || role || 'Unknown';
  };

  if (error && process.env.NODE_ENV === 'development') {
    console.error('Navbar認証エラー:', error);
  }

  return (
    <>
      <nav style={navStyle}>
        <div style={logoStyle}>
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            🏠 教育AIシステム
          </a>
        </div>

        {isLoading ? (
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            認証状態確認中...
          </div>
        ) : isAuthenticated ? (
          renderAuthenticatedNav()
        ) : (
          renderUnauthenticatedNav()
        )}
      </nav>

      {/* 開発環境でのデバッグ情報表示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '400px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>🔍 認証デバッグ</h4>
          <div>Context認証: {debugInfo.contextAuthenticated ? '✅' : '❌'}</div>
          <div>Contextユーザー: {debugInfo.contextUser?.email || 'なし'}</div>
          <div>保存トークン: {debugInfo.hasStoredToken ? '✅' : '❌'}</div>
          <div style={{ fontSize: '10px', marginTop: '0.5rem' }}>
            更新: {debugInfo.timestamp}
          </div>
        </div>
      )}
    </>
  );
}

// スタイル定義
const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '1rem 2rem',
  borderBottom: '1px solid #ddd',
  color: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const logoStyle = {
  fontSize: '1.2em',
  fontWeight: 'bold',
};

const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  backgroundColor: 'rgba(255,255,255,0.1)',
  transition: 'background-color 0.2s',
  fontSize: '0.9em',
  border: 'none',
  fontFamily: 'inherit',
};

const logoutButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9em',
  transition: 'background-color 0.2s',
};

const loginButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'white',
  color: '#667eea',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9em',
  fontWeight: 'bold',
};

const registerLinkStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#ff6b6b',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: '0.9em',
  fontWeight: 'bold',
};

// ✨ 追加: ドロップダウン用のスタイル
const dropdownMenuStyle = {
  position: 'absolute',
  top: '120%',
  left: 0,
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  zIndex: 100,
  minWidth: '160px',
  overflow: 'hidden',
  border: '1px solid #eee'
};

const dropdownLinkStyle = {
  display: 'block',
  padding: '0.8rem 1.2rem',
  color: '#333',
  textDecoration: 'none',
  fontSize: '0.9em',
  transition: 'background-color 0.2s',
};

// ホバーエフェクトはCSS疑似クラスではインラインで表現できないため、
// コンポーネント内で処理するか、別途CSSファイルで定義する必要があります。
// ここでは簡単のため省略しますが、実際には以下のようなCSSを適用すると良いでしょう。
/*
.dropdown-link:hover {
  background-color: #f5f5f5;
}
*/
// src/components/Navbar.js
// 独立認証システム対応版：Cookie依存を完全に排除
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  // デバッグ情報の収集（独立認証システム版）
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

  const handleAdminUsersClick = async (e) => {
    e.preventDefault();
    
    console.log('👥 ユーザー管理クリック - 独立認証システム');
    
    // 独立認証システムでの認証確認
    const currentToken = getCurrentToken();
    const tokenIsValid = isTokenValid();
    
    console.log('🔍 独立認証システム状態:', {
      contextAuthenticated: isAuthenticated,
      contextUser: user,
      hasStoredToken: !!currentToken,
      tokenValid: tokenIsValid,
      userRole: user?.role
    });

    // AuthContextの認証状態のみを信頼
    if (isAuthenticated && user && user.role === 'admin') {
      console.log('✅ 独立認証システム: 認証OK、管理者ページへ遷移');
      
      try {
        await router.push('/admin/users');
        console.log('✅ router.push 完了');
      } catch (routerError) {
        console.error('Router エラー:', routerError);
        // フォールバック: 直接リロード
        window.location.href = '/admin/users';
      }
      return;
    }

    // 認証に問題がある場合
    console.error('❌ 独立認証システム: 認証に問題があります', {
      isAuthenticated,
      user: user?.email,
      role: user?.role
    });
    
    alert(`認証エラー: 
    認証状態: ${isAuthenticated}
    ユーザー: ${user?.email || 'なし'}
    ロール: ${user?.role || 'なし'}
    
    ページをリロードして再度お試しください。`);
  };

  const renderAuthenticatedNav = () => {
    const displayName = user?.last_name && user?.first_name 
      ? `${user.last_name} ${user.first_name}` 
      : user?.email || 'Unknown User';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ 
          padding: '0.5rem', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          👤 {displayName} さん ({getRoleDisplayName(user?.role)})
        </span>

        {/* 管理者用ナビゲーション */}
        {user?.role === 'admin' && (
          <button
            onClick={handleAdminUsersClick}
            style={{
              ...navLinkStyle,
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            👥 ユーザー管理
          </button>
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

  // エラー表示（開発用）
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

      {/* 開発環境でのデバッグ情報表示（独立認証システム版） */}
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
          <h4 style={{ margin: '0 0 0.5rem 0' }}>🔍 独立認証デバッグ</h4>
          <div>Context認証: {debugInfo.contextAuthenticated ? '✅' : '❌'}</div>
          <div>Context読込: {debugInfo.contextLoading ? '⏳' : '完了'}</div>
          <div>Contextユーザー: {debugInfo.contextUser?.email || 'なし'}</div>
          <div>Contextロール: {debugInfo.contextUser?.role || 'なし'}</div>
          <div>保存トークン: {debugInfo.hasStoredToken ? '✅' : '❌'}</div>
          <div>トークン有効: {debugInfo.storedTokenValid ? '✅' : '❌'}</div>
          <div>トークン: {debugInfo.tokenPreview}</div>
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
  ':hover': {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
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
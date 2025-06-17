// src/app/page.js
// タイトル: ホームページ（最終安定版）
// 役割: 安定性のため、自動リダイレクトを廃止し、シンプルなウェルカムページとして機能します。
//       認証状態に応じたナビゲーションは、全ページ共通のNavbarが担当します。
'use client';

import styles from './page.module.css';
import { useAuth } from '@/context/AuthContext'; // ユーザー情報を表示するためにインポート

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();

  // 認証コンテキストの読み込み中はローディング表示
  if (isLoading) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>読み込み中...</p>
      </main>
    );
  }
  
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div style={{ textAlign: 'center' }}>
          <h1>教育AIシステムへようこそ！</h1>
          
          {/* 認証状態に応じてメッセージを切り替え */}
          {isAuthenticated && user ? (
            <p style={{ marginTop: '1rem', color: '#555', fontSize: '1.1em' }}>
              {user.last_name} {user.first_name}さん、こんにちは。<br/>
              上部のナビゲーションから各機能をご利用ください。
            </p>
          ) : (
            <p style={{ marginTop: '1rem', color: '#666' }}>
              AIと共に学ぶ、新しい教育プラットフォーム。
            </p>
          )}
        </div>

        {/* 未認証の場合のみログイン・登録ボタンを表示 */}
        {!isAuthenticated && (
          <div className={styles.ctas}>
            <a href="/login" className={`${styles.primary} primary`}>ログイン</a>
            <a href="/users/register" className={`${styles.secondary} secondary`}>新規登録</a>
          </div>
        )}
      </main>
    </div>
  );
}
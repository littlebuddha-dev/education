// src/app/layout.js
// タイトル: ルートレイアウト
// 役割: 全ページに共通のHTML構造とコンポーネント（Navbarなど）を提供します。
//       [修正] AuthProviderを追加し、アプリケーション全体で認証コンテキストを有効にします。

import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext'; // [修正] AuthProviderをインポート

export const metadata = {
  title: '教育AIシステム',
  description: 'AIと共に学ぶ新しい教育プラットフォーム',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {/* [修正] AuthProviderで全体をラップ */}
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

// src/app/layout.js
// 修正版：AuthGuardを削除し、シンプルな構成に戻す
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: '教育AIシステム',
  description: 'AIと共に学ぶ新しい教育プラットフォーム',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
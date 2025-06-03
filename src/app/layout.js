import { Geist, Geist_Mono } from "next/font/google";
import './globals.css';

import Navbar from '@/components/Navbar';
import ClientOnly from '@/components/ClientOnly';

export const metadata = {
  title: '教育AIシステム',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

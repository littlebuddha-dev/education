'use client';

import { useAuthGuard } from '@/lib/useAuthGuard';
import ChatUI from '@/components/ChatUI';

export default function ChatPage() {
  const ready = useAuthGuard(); // ✅ トークン読み込み完了まで待機

  if (!ready) return null; // ← トークン未確認中は描画しない（誤リダイレクト防止）

  return (
    <main style={{ padding: '2rem' }}>
      <h1>先生とのチャット</h1>
      <ChatUI />
    </main>
  );
}

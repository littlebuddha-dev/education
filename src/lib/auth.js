// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/lib/auth.js
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server'; // NextResponse をインポート
import { getCookie } from '@/utils/authUtils'; // getCookie をインポート

const SECRET = process.env.JWT_SECRET || 'default-secret';

// Cookie からトークンを取得し検証する関数
export function verifyTokenFromCookie(req) {
  // Option 1: req.cookies から取得 (Next.js 13+ の App Router で推奨)
  let token = req.cookies.get?.('token')?.value;

  // Option 2: req.headers から取得 (互換性のため)
  // fetch API の credentials: 'include' で送信された Cookie は
  // req.headers.cookie でアクセスできる場合がある
  if (!token && req.headers.has('cookie')) {
    const cookies = req.headers.get('cookie').split(';');
    for (const cookie of cookies) {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      if (name === 'token') {
        token = parts[1].trim();
        break;
      }
    }
  }

  if (!token) {
    throw new Error('認証トークン（Cookie）が見つかりません');
  }

  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    throw new Error('無効な認証トークンです');
  }
}

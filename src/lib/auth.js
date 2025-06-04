// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/lib/auth.js
import jwt from 'jsonwebtoken';
// import { NextResponse } from 'next/server'; // NextResponse は直接使用しないため削除
// import { getCookie } from '@/utils/authUtils'; // getCookie はサーバーサイドでは使わないため削除

const SECRET = process.env.JWT_SECRET || 'default-secret';

// Cookie からトークンを取得し検証する関数 (サーバーサイド用)
export function verifyTokenFromCookie(req) {
  let token = null;

  // Next.js 13+ の App Router で推奨される req.cookies からの取得
  if (req.cookies && typeof req.cookies.get === 'function') {
    token = req.cookies.get('token')?.value;
  }

  // req.headers からの取得 (req.cookies が使えない場合のフォールバックや互換性のため)
  // fetch API の credentials: 'include' で送信された Cookie は
  // req.headers.cookie でアクセスできる場合がある
  if (!token && req.headers.has('cookie')) {
    const cookiesHeader = req.headers.get('cookie');
    const cookies = cookiesHeader.split(';');
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
    console.error('トークン検証エラー:', err); // エラーを詳細にログ出力
    throw new Error('無効な認証トークンです');
  }
}

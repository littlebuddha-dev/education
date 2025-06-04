// src/lib/auth.js
import jwt from 'jsonwebtoken';

// ⚠️ CRITICAL: login/route.js と同じ値を使用
const SECRET = process.env.JWT_SECRET || 'secret'; // ✅ 'default-secret' から 'secret' に変更

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

  // Authorization ヘッダーからの取得（Bearer トークン対応）
  if (!token && req.headers.has('authorization')) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔑 Authorization ヘッダーからトークン取得');
    }
  }

  if (!token) {
    throw new Error('認証トークン（Cookie または Authorization ヘッダー）が見つかりません');
  }

  console.log('🔑 トークン取得成功:', token.substring(0, 20) + '...');
  console.log('🔑 SECRET使用:', SECRET);

  try {
    const decoded = jwt.verify(token, SECRET);
    console.log('🔑 トークン検証成功:', decoded.role, decoded.email);
    return decoded;
  } catch (err) {
    console.error('🔑 トークン検証エラー:', err.message);
    console.error('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '設定済み' : '未設定');
    throw new Error('無効な認証トークンです');
  }
}

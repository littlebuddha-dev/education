// src/lib/auth.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'default-secret';

// ✅ 旧：Authorization ヘッダーから取得
export function verifyTokenFromHeader(req) {
  const authHeader =
    req.headers.get?.('authorization') || req.headers.get?.('Authorization');

  // console.log('[verifyTokenFromHeader] header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('認証トークンがありません');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  return jwt.verify(token, SECRET);
}

// ✅ 新：Cookie から取得（ミドルウェア/API向け）
export function verifyTokenFromCookie(req) {
  const token = req.cookies.get?.('token')?.value;
  // console.log('[verifyTokenFromCookie] token:', token);

  if (!token) {
    throw new Error('認証トークン（Cookie）が見つかりません');
  }

  return jwt.verify(token, SECRET);
}

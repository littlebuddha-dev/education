// src/lib/auth.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'default-secret';

// Cookie からトークンを取得し検証する関数
export function verifyTokenFromCookie(req) {
  const token = req.cookies.get?.('token')?.value;

  if (!token) {
    throw new Error('認証トークン（Cookie）が見つかりません');
  }

  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    throw new Error('無効な認証トークンです');
  }
}

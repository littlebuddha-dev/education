// src/utils/authUtils.js
// タイトル: 認証ユーティリティ（純粋関数版）
// 役割: トークンの解析と検証を行うヘルパー関数。
// 修正: HttpOnly Cookie環境に対応するため、document.cookieへの直接アクセスを廃止。
//      代わりに、AuthContextなどが保持するアクセストークンを引数として受け取る設計に変更。

import { jwtDecode } from 'jwt-decode';

/**
 * トークンの有効期限をチェックします
 * @param {string} token - 検証するJWTトークン文字列
 * @returns {boolean} 有効であればtrue
 */
export function isTokenValid(token) {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    
    if (decoded.exp && now >= decoded.exp) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * トークンからユーザー情報を抽出します
 * @param {string} token - JWTトークン文字列
 * @returns {object|null} ユーザー情報（キャメルケース）。無効な場合はnull。
 */
export function getUserFromToken(token) {
  if (!isTokenValid(token)) return null;

  try {
    const decodedPayload = jwtDecode(token);
    
    // Auth.jsで生成されたペイロード（キャメルケース）をそのまま返す
    return {
      id: decodedPayload.id,
      email: decodedPayload.email,
      firstName: decodedPayload.firstName,
      lastName: decodedPayload.lastName,
      role: decodedPayload.role,
    };
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}
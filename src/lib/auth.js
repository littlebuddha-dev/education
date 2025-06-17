// src/lib/auth.js
// 修正版：Next.js App Router Cookie同期問題対応
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET環境変数が設定されていません。.env.localを確認してください。');
}

/**
 * JWTトークンを生成します
 */
export function generateToken(payload, expiresIn = '7d') {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  } catch (error) {
    console.error('JWT生成エラー:', error);
    throw new Error('認証トークンの生成に失敗しました');
  }
}

/**
 * JWTトークンを検証します
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('認証トークンの有効期限が切れています');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('無効な認証トークンです');
    } else {
      console.error('JWT検証エラー:', error);
      throw new Error('認証トークンの検証に失敗しました');
    }
  }
}

/**
 * リクエストからトークンを取得し検証する（Next.js App Router対応版）
 */
export function verifyTokenFromCookie(req) {
  let token = null;

  try {
    // 1. Next.js cookies() からの取得（最優先）
    if (req.cookies && typeof req.cookies.get === 'function') {
      const cookieObj = req.cookies.get('token');
      token = cookieObj?.value;
      console.log('🍪 req.cookies.get()からトークン取得:', token ? '成功' : '失敗');
    }

    // 2. headers の Set-Cookie からの取得（ミドルウェア設定直後）
    if (!token && req.headers) {
      const setCookieHeader = req.headers.get ? req.headers.get('set-cookie') : req.headers['set-cookie'];
      if (setCookieHeader) {
        console.log('🔄 Set-Cookieヘッダー確認:', setCookieHeader);
        // Set-Cookieヘッダーからtoken=値を抽出
        const match = setCookieHeader.match(/token=([^;]+)/);
        if (match) {
          token = match[1];
          console.log('🆕 Set-Cookieからトークン取得成功');
        }
      }
    }

    // 3. 通常のCookieヘッダーからの取得
    if (!token && req.headers) {
      const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers.cookie;
      if (cookieHeader) {
        console.log('🍪 Cookieヘッダー:', cookieHeader.substring(0, 100) + '...');
        const cookies = cookieHeader.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.split('=').map(s => s.trim());
          if (name === 'token') {
            token = value;
            console.log('🍪 Cookieヘッダーからトークン取得成功');
            break;
          }
        }
      }
    }

    // 4. Authorization ヘッダーからの取得（フォールバック）
    if (!token && req.headers) {
      const authHeader = req.headers.get ? req.headers.get('authorization') : req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔑 Authorizationヘッダーからトークン取得成功');
      }
    }

    if (!token) {
      console.error('❌ 認証トークンが見つかりません');
      console.log('デバッグ情報:', {
        hasCookies: !!req.cookies,
        hasHeaders: !!req.headers,
        cookieKeys: req.cookies ? Object.keys(req.cookies) : '不明',
        headerKeys: req.headers ? Array.from(req.headers.keys ? req.headers.keys() : Object.keys(req.headers)) : '不明'
      });
      throw new Error('認証トークンが見つかりません。再ログインしてください。');
    }

    // トークンを検証
    const decoded = verifyToken(token);
    
    console.log(`✅ 認証成功: ${decoded.email} (${decoded.role})`);
    return decoded;

  } catch (error) {
    console.error('❌ 認証エラー:', error.message);
    console.log('リクエスト詳細:', {
      url: req.url,
      method: req.method,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'なし'
    });
    throw error;
  }
}

/**
 * Next.js App Routerでのサーバーサイド認証ヘルパー
 * Server ComponentsやRoute Handlersで使用
 */
export async function getServerAuthUser(req) {
  try {
    return verifyTokenFromCookie(req);
  } catch (error) {
    console.log('サーバーサイド認証失敗:', error.message);
    return null;
  }
}

/**
 * 認証が必要なServer Componentで使用するヘルパー
 */
export async function requireAuth(req, allowedRoles = []) {
  const user = verifyTokenFromCookie(req);
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error(`この操作には${allowedRoles.join('または')}の権限が必要です`);
  }
  
  return user;
}
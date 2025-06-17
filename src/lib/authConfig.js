// src/lib/authConfig.js
// 最終修正版：ルートパス "/" の誤マッチを防ぐ

export const publicPaths = [
  '/',
  '/login',
  '/users/register', 
  '/setup',
  '/favicon.ico',
  '/api/users/login',
  '/api/users/register',
  '/api/setup',
  '/api/tables',
  '/api/users/check-admin',
  '/_next',
  '/static',
  '/_app',
  '/.well-known',
];

export function isPublicPath(pathname) {
  console.log(`🔍 isPublicPath check: "${pathname}"`);
  
  // 完全一致チェック
  if (publicPaths.includes(pathname)) {
    console.log(`✅ Exact match found: "${pathname}"`);
    return true;
  }
  
  // プレフィックスマッチチェック（ルートパス "/" を除外）
  for (const publicPath of publicPaths) {
    // ルートパス "/" は完全一致のみで処理済みなのでスキップ
    if (publicPath === '/') {
      continue;
    }
    
    // /path で始まり、次が / の場合のマッチ
    if (pathname.startsWith(publicPath + '/')) {
      console.log(`✅ Prefix match: "${pathname}" starts with "${publicPath}/"`);
      return true;
    }
    
    // /path/ 形式の場合のマッチ
    if (publicPath.endsWith('/') && pathname.startsWith(publicPath)) {
      console.log(`✅ Trailing slash match: "${pathname}" starts with "${publicPath}"`);
      return true;
    }
  }
  
  console.log(`❌ No match found for: "${pathname}"`);
  return false;
}

export function isAdminPath(pathname) {
  const result = pathname.startsWith('/admin');
  console.log(`🛡️ isAdminPath("${pathname}"): ${result}`);
  return result;
}

export function isParentPath(pathname) {
  return pathname.startsWith('/children');
}

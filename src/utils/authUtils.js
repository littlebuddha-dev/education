// littlebuddha-dev/education/education-af9f7cc579e22203496449ba55f5ee95bf0f4648/src/utils/authUtils.js
// Cookieから値を取り出す関数
export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// Cookieにトークンをセットする関数
export function setAuthCookie(token) {
  document.cookie = `token=${token}; path=/; max-age=3600; SameSite=Lax`;
}

// Cookieからトークンを削除する関数
export function removeAuthCookie() {
  document.cookie = 'token=; Max-Age=0; path=/;';
}
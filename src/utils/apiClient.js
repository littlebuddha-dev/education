// /src/utils/apiClient.js
// 役割: APIリクエストをラップし、認証ヘッダーの付与とトークンリフレッシュを自動化する。

let accessToken = null;
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const setAccessToken = (token) => {
  accessToken = token;
};

const getAccessToken = () => accessToken;

const apiClient = async (url, options = {}) => {
  const customOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (accessToken) {
    customOptions.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    let response = await fetch(url, customOptions);

    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // ✅【修正】credentials: 'include' を追加してCookieをリクエストに含める
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          const data = await refreshResponse.json();

          if (!refreshResponse.ok) {
            throw new Error(data.error || 'Session expired');
          }

          const newAccessToken = data.accessToken;
          setAccessToken(newAccessToken);
          window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: data }));
          
          processQueue(null, newAccessToken);
          
          customOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, customOptions);

        } catch (refreshError) {
          processQueue(refreshError, null);
          window.dispatchEvent(new Event('logout'));
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(newAccessToken => {
            customOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return fetch(url, customOptions);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
    }

    return response;
  } catch (error) {
    console.error('API Client Error:', error);
    return Promise.reject(error);
  }
};

export { apiClient, setAccessToken, getAccessToken };
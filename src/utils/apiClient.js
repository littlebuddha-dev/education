// /src/utils/apiClient.js
// 役割: APIリクエストをラップし、認証ヘッダーの付与とトークンリフレッシュを自動化する

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

// 名前付きエクスポートに統一
export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const apiClient = async (url, options = {}) => {
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
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });
          
          if (!refreshResponse.ok) {
            const errorData = await refreshResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Session expired');
          }

          const data = await refreshResponse.json();
          const newAccessToken = data.accessToken;
          
          setAccessToken(newAccessToken);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: data }));
          }
          
          processQueue(null, newAccessToken);
          
          customOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, customOptions);

        } catch (refreshError) {
          processQueue(refreshError, null);
          // ログアウトイベントは、無限ループを防ぐため慎重に扱う
          if (typeof window !== 'undefined') {
             window.dispatchEvent(new Event('logout'));
          }
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
          });
      }
    }

    return response;

  } catch (error) {
    console.error('API Client Network Error:', error);
    throw error;
  }
};
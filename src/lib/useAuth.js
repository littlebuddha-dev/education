// src/lib/useAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setUser(decoded); // { id, email, first_name, last_name, role, ... }
    } catch (err) {
      console.error('トークン解析エラー:', err);
      setUser(null);
    }
  }, []);

  return { user };
}
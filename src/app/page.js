import { query } from '@/lib/db';
import { notFound } from 'next/navigation';


export default async function HomePage() {
  try {
    const result = await query('SELECT id, email FROM users');
    const users = result.rows;

    return (
      <main style={{ padding: "2rem" }}>
        <h1>ユーザー一覧</h1>
        {users.length === 0 ? (
          <p>ユーザーが見つかりませんでした。</p>
        ) : (
          <ul>
            {users.map(user => (
              <li key={user.id}>
                <strong>ID:</strong> {user.id}<br />
                <strong>Email:</strong> {user.email}
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  } catch (err) {
    console.error('DBエラー:', err);
    return (
      <main style={{ padding: "2rem" }}>
        <h1>エラー</h1>
        <p>データベース接続に失敗しました。</p>
      </main>
    );
  }
}

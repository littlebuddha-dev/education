import { query } from '@/lib/db';

export default async function ChildDetailPage({ params }) {
  const childId = params.id;

  // 子ども情報を取得
  const childRes = await query(
    `SELECT name, birthday, gender FROM children WHERE id = $1`,
    [childId]
  );
  const child = childRes.rows[0];

  if (!child) return <div>子どもが見つかりませんでした。</div>;

  // スキルログを取得
  const logsRes = await query(
    `SELECT skill_name, score, context, timestamp
     FROM skill_logs
     WHERE child_id = $1
     ORDER BY timestamp DESC`,
    [childId]
  );
  const logs = logsRes.rows;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{child.name} さんの学習履歴</h1>
      <p>誕生日: {child.birthday}</p>
      <p>性別: {child.gender}</p>

      <h2 style={{ marginTop: '2rem' }}>スキルログ</h2>
      {logs.length === 0 ? (
        <p>スキルログがまだ登録されていません。</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>スキル名</th>
              <th>スコア</th>
              <th>背景</th>
              <th>記録日時</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.skill_name}</td>
                <td>{log.score}</td>
                <td>{log.context || '（なし）'}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

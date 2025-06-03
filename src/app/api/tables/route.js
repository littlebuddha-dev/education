import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    return Response.json(result.rows);
  } catch (err) {
    console.error('Error fetching table list:', err);
    return Response.json({ error: 'DB接続に失敗しました' }, { status: 500 });
  }
}

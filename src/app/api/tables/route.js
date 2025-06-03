// littlebuddha-dev/education/education-676d25275fadd678f043e2a225217161a768db69/src/app/api/tables/route.js
import { query } from '@/lib/db';

export async function GET() {
  try {
    // データベース接続テストを兼ねて、テーブル一覧を取得
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    // 接続成功した場合は、テーブルリストと共に success: true を返す
    return Response.json({ success: true, tables: result.rows });
  } catch (err) {
    console.error('Error fetching table list or connecting to DB:', err);
    // 接続失敗やエラーの場合は、success: false とエラーメッセージを返す
    return Response.json({ success: false, error: 'DB接続に失敗しました。PostgreSQLが起動しているか、.env.localの設定を確認してください。' }, { status: 500 });
  }
}

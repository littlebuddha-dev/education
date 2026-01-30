# **教育AIシステム (Education AI System)**

AIを活用して子供たちの学習をサポートし、保護者が成長を見守るための教育プラットフォームです。Next.js (App Router) と PostgreSQL を使用して構築されています。

## **🚀 前提条件**

開発を始める前に、以下のツールがインストールされていることを確認してください。

* **Node.js**: v18.17.0 以上 (v20推奨)  
* **npm**: Node.jsに同梱  
* **Docker & Docker Compose**: データベースを実行するために必要

## **🛠️ 環境構築手順**

### **1\. リポジトリのクローンと依存関係のインストール**

\# 依存パッケージのインストール  
npm install

### **2\. 環境変数の設定**

プロジェクトルートにある env.sample をコピーして、.env.local ファイルを作成します。

cp env.sample .env.local

.env.local を開き、必要に応じて設定を変更してください。

特に **OpenAI APIキー** (OPENAI\_API\_KEY) は、AI機能を使用するために必要です。

\# .env.local の例  
POSTGRES\_USER=user  
POSTGRES\_PASSWORD=password  
POSTGRES\_DB=userdb  
PGHOST=localhost  
PGPORT=5433  \# Dockerの設定に合わせる（デフォルト: 5433）  
OPENAI\_API\_KEY=sk-your-api-key-here

### **3\. データベースの起動**

Docker Composeを使用してPostgreSQLデータベースを起動します。

ポート競合を避けるため、ホスト側の **5433番ポート** を使用する設定になっています。

\# データベースコンテナをバックグラウンドで起動  
docker compose up \-d db

\# 起動確認 (Statusが Up になっていること)  
docker compose ps

### **4\. データベースの初期化 (セットアップ)**

テーブルの作成と初期データ（シードデータ）の投入を行います。

コンテナが完全に起動するまで数秒待ってから実行してください。

npm run db:setup

成功すると、以下のメッセージが表示されます。

✅ Schema applied successfully.

✅ Seed data inserted successfully.

🎉 Database setup completed\!

### **5\. 開発サーバーの起動**

npm run dev

ブラウザで [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) にアクセスしてください。

## **🔑 ログイン情報 (初期データ)**

セットアップ時に以下のテスト用アカウントが作成されます。

### **管理者 (Admin)**

全データの閲覧・管理が可能です。

* **Email**: admin@example.com  
* **Password**: adminpassword

### **保護者 (Parent)**

子供の学習記録の管理やチャット相手の選択が可能です。

* **Email**: parent1@example.com  
* **Password**: parentpassword

### **子供 (Child)**

AIとのチャットや学習が可能です。

* **Email**: child1@example.com  
* **Password**: childpassword

## **🆘 トラブルシューティング**

### **ログインできない / パスワードが通らない場合**

環境によってハッシュ化の結果が異なる場合があるため、以下の手順で管理者パスワードを再設定してください。

1. プロジェクトルートに reset-admin.js というファイルを作成し、以下のコードを記述します。

// reset-admin.js  
import { Pool } from 'pg';  
import bcrypt from 'bcrypt';  
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });  
dotenv.config({ path: '.env' });

const pool \= new Pool({  
  host: process.env.PGHOST,  
  port: process.env.PGPORT,  
  user: process.env.PGUSER,  
  password: process.env.PGPASSWORD,  
  database: process.env.PGDATABASE,  
});

async function resetAdmin() {  
  try {  
    const email \= 'admin@example.com';  
    const password \= 'adminpassword';  
    const hash \= await bcrypt.hash(password, 10);  
      
    const res \= await pool.query(  
      \`UPDATE users SET password\_hash \= $1 WHERE email \= $2 RETURNING id\`,  
      \[hash, email\]  
    );

    if (res.rowCount \> 0\) {  
      console.log(\`✅ Password for ${email} has been updated successfully.\`);  
    } else {  
      console.error(\`❌ User ${email} not found.\`);  
    }  
  } catch (err) {  
    console.error(err);  
  } finally {  
    pool.end();  
  }  
}

resetAdmin();

2. スクリプトを実行してパスワードを更新します。

node reset-admin.js

### **データベースを完全にリセットしたい場合**

セットアップに失敗したり、データを初期状態に戻したい場合は以下の手順を実行してください。

**注意: すべてのデータが削除されます。**

1. コンテナとボリュームを削除します。  
   docker compose down \-v

2. コンテナを再起動します。  
   docker compose up \-d db

3. 初期化スクリプトを再実行します。  
   npm run db:setup

### **スキル統計ページなどでエラーが出る場合**

Next.js 15 以降、APIルートの params は非同期（Promise）になりました。

もし params.id などのアクセスでエラーが出る場合は、必ず await してください。

// 修正例  
export async function GET(req, { params }) {  
  const { id } \= await params; // awaitが必要  
  // ...  
}

## **📂 ディレクトリ構成**

* src/app: Next.js App Router ページコンポーネント  
* src/components: 再利用可能なReactコンポーネント  
* src/lib: ユーティリティ、認証ロジック、DB接続設定など  
* src/repositories: データベースアクセスのロジック（SQLクエリなど）  
* scripts: データベースセットアップ用スクリプト  
* schema.sql: データベースのテーブル定義  
* seed.sql: 初期投入用データ
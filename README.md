# **Education AI System \- 開発環境セットアップガイド**

このプロジェクトは、子どもの成長と学習を支援する教育AIシステムのプロトタイプです。

**Next.js (App Router)** と **PostgreSQL** を使用しています。

初見の方でも以下の手順通りに進めれば、約5〜10分で開発環境を立ち上げることができます。

## **✅ 前提条件 (Prerequisites)**

開発を始める前に、以下のツールがインストールされていることを確認してください。

* **Node.js**: v18系 または v20系 (LTS推奨)  
* **Docker Desktop**: データベースを起動するために必須です。

## **🚀 クイックスタート (Quick Start)**

ターミナルを開き、プロジェクトのルートディレクトリで以下のコマンドを順番に実行してください。

### **Step 1\. 依存パッケージのインストール**

まずはプロジェクトに必要なライブラリをインストールします。

npm install

### **Step 2\. 環境変数の設定**

設定ファイルを作成します。.env.sample ではなく、Docker連携のために **.env** を使用するのがポイントです。

\# サンプルをコピーして .env を作成  
cp env.sample .env

作成された .env ファイルを開き、以下の内容になっているか確認してください。

**特にポート番号が 5433 になっている点に注意してください（Mac標準のPostgreSQLとの競合回避のため）。**

\# \--- .env ファイルの内容 \---

\# データベース設定 (Docker Compose & セットアップスクリプト用)  
DB\_USER=user  
DB\_PASSWORD=password  
DB\_NAME=userdb  
DB\_HOST=127.0.0.1  
DB\_PORT=5433

\# Next.js アプリケーション用 (pgライブラリの標準変数)  
PGHOST=127.0.0.1  
PGPORT=5433  
PGUSER=user  
PGPASSWORD=password  
PGDATABASE=userdb

\# 認証設定 (開発用ダミーキー)  
JWT\_SECRET=dev-secret-key-12345  
JWT\_REFRESH\_SECRET=dev-refresh-secret-67890

### **Step 3\. データベースの起動**

Dockerを使ってPostgreSQLデータベースを起動します。

\# データベースコンテナをバックグラウンドで起動  
docker compose up \-d db

実行後、docker ps コマンドで education-db という名前のコンテナが動いていることを確認できます。

### **Step 4\. データベースの初期化**

テーブルの作成と初期データ（シードデータ）の投入を行います。

専用のスクリプトが用意されており、複雑な手順を自動化しています。

npm run db:setup

成功すると、以下のようなメッセージが表示されます。

✨ セットアップ完了！

### **Step 5\. アプリケーションの起動**

開発サーバーを立ち上げます。

npm run dev

ブラウザで [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) にアクセスしてください。

## **🔑 ログイン情報 (Test Accounts)**

初期化(db:setup)直後に使えるテスト用アカウントです。

| ロール | メールアドレス | パスワード | 備考 |
| :---- | :---- | :---- | :---- |
| **管理者** | admin@example.com | adminpassword | 全データ閲覧可 |
| **保護者** | apple.darwin@gmail.com | password123 | セットアップ済みデータ |
| **保護者** | parent1@example.com | parentpassword | 田中太郎 |
| **子ども** | child1@example.com | childpassword | 田中一郎 |

## **🛠 トラブルシューティング**

うまく動かない場合は、以下を確認してください。

### **Q. bind: address already in use エラーが出る**

**原因:** ポート5432または5433が既に使用されています。

**対策:** Macで他のPostgreSQLが動いている可能性があります。docker-compose.yml と .env のポート番号を 5434 などに変更して再試行してください。

### **Q. role "user" does not exist エラーが出る**

**原因:** データベースが古い設定のまま残っています。

**対策:** データベースを一度完全に削除して作り直します。

\# コンテナとデータを完全削除  
docker compose down \-v

\# 再起動  
docker compose up \-d db

\# 少し待ってから初期化  
sleep 5  
npm run db:setup

### **Q. ページが白紙になる、またはリロードを繰り返す**

**原因:** ブラウザに残っている古いCookieが悪さをしている可能性があります。

**対策:** ブラウザのCookieを削除するか、シークレットウィンドウで試してください。

## **📁 主要なディレクトリ構造**

* src/app: Next.js App Routerのページコンポーネント  
* src/lib: DB接続(db.js)や認証(auth.js)などのコアロジック  
* src/components: 再利用可能なUIコンポーネント  
* src/repositories: データベース操作をまとめた層  
* scripts: DBセットアップ用スクリプト  
* schema.sql: テーブル定義  
* seed.sql: 初期データ定義

Enjoy coding\! 🚀
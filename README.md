# 教育AIシステム

このプロジェクトは、AIチャット機能を中心に、子どものアカデミックな能力向上を支援し、教育スケジュールに基づいて学習をナビゲートする教育AIシステムです。保護者は子どもとのチャットを通じて学習をサポートし、子どもの学習履歴やスキル評価を管理できます。管理者は、システム全体のユーザーと学習データを効率的に管理するための機能を利用できます。

## 構成技術

- **フロントエンド:** Next.js (App Router), React
- **バックエンド:** Next.js API Routes (Node.js)
- **データベース:** PostgreSQL
- **AI/LLM連携:** Ollama, OpenAI, Gemini, Claude (src/lib/llmRouter.js経由で選択可能)
- **認証:** JWT (JSON Web Tokens) を使用したCookieベースの認証
- **パスワードハッシュ:** bcrypt

## 主要機能

### 1. ユーザー・認証

- **ユーザー登録:** 新規ユーザー（保護者/管理者）の登録が可能です。パスワードは bcrypt でハッシュ化され安全に保存されます。
- **ログイン:** メールアドレスとパスワードでログインし、JWTベースのセッション管理が行われます。
- **認証ガード:** 未ログインユーザーは保護されたページにアクセスできません。

### 2. 子ども管理

- **子ども登録:** 保護者ユーザーは自分の子どもをシステムに登録できます。
- **子ども詳細/学習履歴:** 各子どもの誕生日、性別、およびスキルログを確認できます。(`/page.js`)
- **AI評価ログ:** AIによる会話内容からのスキル評価履歴を閲覧できます。(`/evaluation/page.js`)
- **学習進捗:** 設定された学習目標に対する子どもの進捗状況を確認できます。(`/learning-progress/route.js`)

### 3. AIチャット教育

- **先生とのチャット:** 子ども（または保護者）はAI先生と対話できます。
- **会話ログ保存:** チャットの会話内容はデータベースに記録されます。
- **自動スキル評価:** AIとの会話内容に基づいて、子どものスキルが自動的に評価され、`evaluation_logs` テーブルに記録されます。評価結果は「教科」「分野」「難易度」「理由」「学習方針」を含みます。
- **スキルスコア更新:** AI評価に基づき、ユーザーの総合スキルスコアが更新されます。
- **学習進捗自動更新:** AI評価の結果、該当する学習目標の進捗が「達成済み」に更新される場合があります。

### 4. スキルログ記録

- **手動スキルログ:** 保護者は子どものスキルログを手動で追加できます（分野、スコア）。

### 5. 管理者機能

- **全ユーザー管理:** 管理者はシステムに登録されている全ユーザーの一覧を閲覧し、削除することができます。各ユーザーの子ども数や子ども名も表示されます。
- **ユーザー別スキル統計:** 管理者は特定の保護者ユーザーの子どものスキルログ統計（分野別平均スコア、記録件数、最終記録日）を閲覧できます。(`/skills/route.js`)

## 開発環境のセットアップ

### 前提条件

- Node.js v23.11.0 以降 (推奨)
- npm 11.3.0 以降 (推奨)
- PostgreSQL データベース
- Homebrew (macOSユーザーの場合)

### 1. リポジトリのクローン

```bash
git clone <あなたのリポジトリURL>
cd education-main
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください。

```env
# PostgreSQL データベース接続情報
PGHOST=localhost
PGPORT=5432
PGUSER=user
PGPASSWORD=postgres
PGDATABASE=userdb

# JWT シークレット（任意の文字列を設定）
JWT_SECRET=your_jwt_secret_key_here

# LLM API キー (使用するLLMプロバイダーに応じて設定)
# Ollama はローカルで動作するためAPIキーは不要
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. データベースのセットアップ

#### 1. PostgreSQLのインストール

まだインストールしていない場合は、Homebrew（macOS）または公式のインストーラーを使用してPostgreSQLをインストールしてください。

```bash
# macOS の場合
brew install postgresql
brew services start postgresql
```

#### 2. データベースとユーザーの作成

PGUSER および PGDATABASE で指定したユーザーとデータベースを作成します。

```sql
# psql コマンドで接続
psql postgres

# データベースとユーザーを作成
CREATE USER user WITH PASSWORD 'postgres';
CREATE DATABASE userdb OWNER user;
\q
```

#### 3. スキーマと初期データの投入

プロジェクトルートで以下のコマンドを実行し、テーブルを作成し、初期データを投入します。

```bash
psql -U user -d userdb -f schema.sql

# 管理者と保護者ユーザーのパスワードハッシュを生成
node hash-password.js
# 出力されたハッシュを seed.sql に貼り付け
# 例: 'admin@example.com' のパスワードが 'adminpassword' の場合
# ('admin@example.com', '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '管理者', 'テスト', 'admin')

psql -U user -d userdb -f seed.sql
```

**注意:** `seed.sql` の `YOUR_GENERATED_ADMIN_HASH` と `YOUR_GENERATED_PARENT_HASH` の部分は、`node hash-password.js` で生成した実際のハッシュ値に置き換える必要があります。

### 4. 依存関係のインストール

プロジェクトルートでnpmまたはyarnを使用して依存関係をインストールします。

```bash
npm install
# または
yarn install
```

### 5. LLMの準備 (Ollamaを使用する場合)

Ollamaを使用する場合、ローカルにLLMモデルをダウンロードしておく必要があります。
詳細はこちら: https://ollama.com/

例: gemma3:latest モデルをダウンロードする場合

```bash
ollama pull gemma3:latest
```

### 6. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

### 7. アプリケーションへのアクセス

ブラウザで http://localhost:3000 にアクセスしてください。

## 推奨される開発フロー

1. **ユーザー登録:** まずは `/users/register` ページで保護者ユーザーを登録します。
2. **ログイン:** 登録したユーザーでログインします (`/login`)。
3. **子ども登録:** ログイン後、`/children/register` から子どもを登録します。
4. **チャット開始:** 子どもを登録したら、`/chat` ページでAI先生とのチャットを開始できます。
5. **学習履歴の確認:** `/children` ページから各子どもの詳細ページへ進み、スキルログや学習進捗を確認できます。
6. **管理者機能 (オプション):** `admin@example.com` でログインすると、`/admin/users` から全ユーザーの管理やスキル統計の閲覧が可能です。

## その他の情報

### スキル評価プロンプトの調整

`src/app/api/chat/route.js` 内の `evalPrompt` を変更することで、AIのスキル評価の粒度や内容を調整できます。より詳細な能力分析（例：「接続詞の使い方が弱い」「語彙力が少ない」）をAIに促すプロンプトにすることで、教育の個別最適化を進めることが可能です。

### 新しい学習目標の追加

`learning_goals` テーブルに直接データを挿入するか、または管理画面を実装して、新しい学習目標を定義することができます。これにより、子どもの学習スケジュールを柔軟に設定・運用できます。

## データベースのテーブル構成

システムのデータベーススキーマは `schema.sql` に定義されています。

- **users:** ユーザー情報 (保護者、管理者)
- **children:** 子ども情報 (保護者に紐付け)
- **conversation_logs:** AIチャットの会話履歴
- **evaluation_logs:** AIによるスキル評価の詳細ログ
- **skill_scores:** ユーザーごとの総合スキルスコア (集計値)
- **skill_logs:** 保護者が手動で記録するスキルログ
- **learning_goals:** 定義された学習目標 (カリキュラム項目)
- **child_learning_progress:** 各子どもの学習目標に対する進捗状況

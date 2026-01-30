# Dockerfile
# ベースイメージにNode.js 20 (Alpine) を使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# パッケージ定義ファイルをコピー
COPY package*.json ./

# 依存関係をインストール
# CI=trueを設定することで、npm ciのような厳密なインストールを行うことも可能ですが、
# 開発段階ではinstallを使用します。
RUN npm install

# ソースコード全体をコピー
COPY . .

# Next.jsのデフォルトポート
EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "run", "dev"]
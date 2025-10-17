# Vercel デプロイガイド

このドキュメントでは、LAMARLフロントエンドをVercelにデプロイする手順を説明します。

## 📋 前提条件

- Vercelアカウント
- デプロイ済みのバックエンドAPI（FastAPI）
- pnpm（推奨）または npm

## 🚀 デプロイ手順

### 1. Vercelプロジェクトの作成

#### 方法A: Vercel CLIを使用

```bash
cd frontend
npx vercel
```

初回実行時、以下の質問に答えます：
- Set up and deploy? → `Y`
- Which scope? → あなたのアカウントを選択
- Link to existing project? → `N`
- What's your project's name? → `lamarl-frontend`（任意）
- In which directory is your code located? → `./`

#### 方法B: Vercel Dashboard（推奨）

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. "Add New Project"をクリック
3. Gitリポジトリをインポート（またはファイルをアップロード）
4. **Root Directory**を`frontend`に設定
5. **Framework Preset**を`Vite`に設定（自動検出されるはず）
6. 環境変数を設定（次のセクション参照）

### 2. 環境変数の設定（最重要）

Vercelダッシュボードの"Settings" → "Environment Variables"で以下を設定：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `VITE_API_URL` | `https://your-backend-api.com` | バックエンドAPIのURL |

⚠️ **注意**: 
- `VITE_`プレフィックスは必須です（Viteの仕様）
- デプロイ後に環境変数を変更した場合は、再デプロイが必要です

### 3. ビルド設定

Vercelは自動的に検出しますが、手動設定する場合：

- **Framework Preset**: `Vite`
- **Build Command**: `pnpm build` または `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install` または `npm install`

### 4. バックエンドのCORS設定

バックエンド（FastAPI）のCORS設定に、Vercelのデプロイ先URLを追加する必要があります：

```python
# backend/app/main.py

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://your-app.vercel.app",  # ← これを追加
        "https://*.vercel.app",          # ← プレビューデプロイ用（オプション）
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

⚠️ **セキュリティ注意**: 
- 本番環境では`allow_origins=["*"]`は使用しないでください
- 実際のVercelドメインを明示的に指定してください

## 🔍 デプロイ後の確認

1. **ブラウザコンソールで確認**
   - デプロイされたURLにアクセス
   - ブラウザの開発者ツール（F12）でコンソールを開く
   - 以下のログを確認：
     ```
     🔧 API_BASE: https://your-backend-api.com
     🔧 VITE_API_URL: https://your-backend-api.com
     ```

2. **APIヘルスチェック**
   - アプリ内でAPIとの接続が成功するか確認
   - ネットワークタブでAPI呼び出しを確認

3. **エラー確認**
   - CORS エラーが出る場合 → バックエンドのCORS設定を確認
   - `localhost:8000` に接続しようとする場合 → `VITE_API_URL`環境変数を確認

## 🛠️ トラブルシューティング

### CORS エラー
```
Access to fetch at 'https://backend.com/api' from origin 'https://app.vercel.app' 
has been blocked by CORS policy
```

**解決策**: バックエンドのCORS設定にフロントエンドのURLを追加

### 環境変数が反映されない

1. Vercelダッシュボードで環境変数が正しく設定されているか確認
2. 環境変数名が`VITE_`で始まっているか確認
3. 環境変数を設定・変更後に再デプロイ

### ビルドエラー

```bash
# ローカルでビルドが成功するか確認
cd frontend
pnpm build

# 問題がある場合は依存関係を再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 🔄 継続的デプロイ

Gitリポジトリと連携している場合、以下のブランチへのpushで自動デプロイされます：

- **main/master** → 本番環境
- **その他のブランチ** → プレビューデプロイ

## 📚 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)

## 📝 チェックリスト

デプロイ前に確認：

- [ ] バックエンドAPIがデプロイされている
- [ ] バックエンドのCORS設定にフロントエンドURLを追加
- [ ] Vercelに`VITE_API_URL`環境変数を設定
- [ ] ローカルで`pnpm build`が成功する
- [ ] `.env`ファイルをGitにコミットしていない（`.gitignore`で除外）

デプロイ後に確認：

- [ ] ブラウザコンソールで`API_BASE`が正しいURLを指している
- [ ] APIヘルスチェックが成功する
- [ ] CORSエラーが発生していない
- [ ] アプリの基本機能が動作する


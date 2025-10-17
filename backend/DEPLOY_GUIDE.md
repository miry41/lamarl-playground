# バックエンドデプロイガイド (Google Cloud Run)

## 前提条件

- Google Cloud SDKがインストール済み
- フロントエンドがVercelにデプロイ済み

## 手順

### 1. GCP初期設定

```bash
# Google Cloud にログイン
gcloud auth login

# プロジェクトを作成（新規の場合）
gcloud projects create lamarl-playground

# プロジェクトを選択
gcloud config set project lamarl-playground

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# リージョンを設定（東京リージョン）
gcloud config set run/region asia-northeast1
```

### 2. 環境変数の準備

```bash
# Secret Manager に API キーを保存（推奨）
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# フロントエンドのURLを確認
# 例: https://your-app.vercel.app
```

### 3. バックエンドをデプロイ

```bash
# backendディレクトリに移動
cd backend

# Cloud Run にデプロイ
gcloud run deploy lamarl-backend \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "FRONTEND_URL=https://your-app.vercel.app" \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest"
```

**重要**: `https://your-app.vercel.app` を実際のVercelのURLに置き換えてください。

### 4. デプロイ後の確認

デプロイが完了すると、Cloud Run のURLが表示されます：
```
Service URL: https://lamarl-backend-xxxxx-an.a.run.app
```

このURLをコピーして、Vercelの環境変数に設定します。

### 5. Vercel側の設定

Vercelのプロジェクト設定で環境変数を追加：

1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. 新しい環境変数を追加：
   - **Name**: `VITE_API_URL`
   - **Value**: `https://lamarl-backend-xxxxx-an.a.run.app` (Cloud RunのURL)
   - **Environment**: Production, Preview, Development すべてにチェック
3. 再デプロイ

### 6. 動作確認

```bash
# ヘルスチェック
curl https://lamarl-backend-xxxxx-an.a.run.app/

# ログを確認
gcloud run services logs read lamarl-backend --region asia-northeast1 --limit 50
```

## よくあるコマンド

### ログの確認
```bash
# リアルタイムログ
gcloud run services logs tail lamarl-backend --region asia-northeast1

# 最新50件
gcloud run services logs read lamarl-backend --region asia-northeast1 --limit 50
```

### サービス情報の確認
```bash
gcloud run services describe lamarl-backend --region asia-northeast1
```

### 再デプロイ
```bash
cd backend
gcloud run deploy lamarl-backend \
  --source . \
  --region asia-northeast1
```

### 環境変数の更新
```bash
gcloud run services update lamarl-backend \
  --region asia-northeast1 \
  --set-env-vars "FRONTEND_URL=https://new-url.vercel.app"
```

### サービスの削除
```bash
gcloud run services delete lamarl-backend --region asia-northeast1
```

## トラブルシューティング

### CORS エラーが出る場合
1. `FRONTEND_URL` 環境変数が正しく設定されているか確認
2. VercelのURLにhttps://が含まれているか確認
3. バックエンドを再デプロイ

### デプロイに失敗する場合
```bash
# ローカルでDockerビルドをテスト
cd backend
docker build -t lamarl-backend-test .
docker run -p 8080:8080 lamarl-backend-test
```

### メモリ不足の場合
```bash
# メモリを増やして再デプロイ
gcloud run services update lamarl-backend \
  --region asia-northeast1 \
  --memory 4Gi \
  --cpu 4
```

## コスト最適化

- 使用量が少ない場合は、メモリとCPUを減らす
- タイムアウトを短く設定（必要に応じて）
- リクエストが少ない時は自動的にゼロスケールされる

## セキュリティ

- 本番環境では `--allow-unauthenticated` を慎重に使用
- Secret Manager を使用してAPIキーを管理
- 環境変数に機密情報を直接含めない


#!/bin/bash

# バックエンドをGoogle Cloud Runにデプロイするスクリプト

set -e

# 色付きの出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== LAMARL Backend デプロイスクリプト ===${NC}"
echo ""

# プロジェクトIDの確認
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}エラー: GCPプロジェクトが設定されていません${NC}"
    echo "以下のコマンドでプロジェクトを設定してください："
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}プロジェクトID: ${PROJECT_ID}${NC}"
echo ""

# リージョンの確認
REGION=$(gcloud config get-value run/region 2>/dev/null)
if [ -z "$REGION" ]; then
    REGION="asia-northeast1"
    echo -e "${YELLOW}リージョンが設定されていません。デフォルト(${REGION})を使用します${NC}"
    gcloud config set run/region $REGION
fi

echo -e "${GREEN}リージョン: ${REGION}${NC}"
echo ""

# フロントエンドURLの入力
read -p "VercelのフロントエンドURL (例: https://your-app.vercel.app): " FRONTEND_URL

if [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}フロントエンドURLが必要です${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}デプロイを開始します...${NC}"
echo ""

# Cloud Runにデプロイ
gcloud run deploy lamarl-backend \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "FRONTEND_URL=${FRONTEND_URL}"

echo ""
echo -e "${GREEN}=== デプロイ完了！ ===${NC}"
echo ""
echo -e "${YELLOW}次のステップ：${NC}"
echo "1. 上記に表示されたService URLをコピー"
echo "2. Vercelプロジェクトの環境変数に追加："
echo "   - Name: VITE_API_URL"
echo "   - Value: (コピーしたService URL)"
echo "3. Vercelを再デプロイ"
echo ""


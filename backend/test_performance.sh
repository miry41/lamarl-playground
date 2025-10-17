#!/bin/bash

echo "🚀 パフォーマンステスト開始"
echo "============================================================"

# 1. エピソード作成
echo "📝 Step 1: エピソード作成中..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8000/episodes \
  -H "Content-Type: application/json" \
  -d '{
    "shape": "circle",
    "seed": 1234,
    "n_robot": 10,
    "r_sense": 0.4,
    "r_avoid": 0.1,
    "nhn": 6,
    "nhc": 80,
    "grid_size": 64,
    "l_cell": 1.0
  }')

EPISODE_ID=$(echo $CREATE_RESPONSE | grep -o '"episode_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$EPISODE_ID" ]; then
    echo "❌ エピソード作成失敗: $CREATE_RESPONSE"
    exit 1
fi

echo "✅ エピソードID: $EPISODE_ID"

# 2. 学習開始
echo ""
echo "📝 Step 2: 学習開始（2エピソード × 100ステップ）..."

START_TIME=$(date +%s)

TRAIN_RESPONSE=$(curl -s -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d "{
    \"episode_id\": \"$EPISODE_ID\",
    \"episodes\": 2,
    \"episode_len\": 100,
    \"use_llm\": false
  }")

echo "✅ 学習タスク開始: $TRAIN_RESPONSE"

# 3. 進捗監視（タイムアウト30秒）
echo ""
echo "📝 Step 3: 進捗監視中（30秒でタイムアウト）..."

timeout 30s curl -s -N "http://localhost:8000/stream?episode_id=$EPISODE_ID" | \
  grep -o '"type":"[^"]*"' | head -100 | \
  while read line; do
    echo "  📊 Event: $line"
  done

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# 4. 結果サマリー
echo ""
echo "============================================================"
echo "📊 パフォーマンステスト結果"
echo "============================================================"
echo "⏱️  実行時間: ${ELAPSED}秒"
echo "💡 理論値:"
echo "  - 総ステップ数: 200 = 2 ep × 100 steps"
echo "  - 処理速度目標: 50+ steps/秒"
STEPS_PER_SEC=$((200 / ELAPSED))
echo "⚡ 実測処理速度: ${STEPS_PER_SEC} steps/秒"

if [ $STEPS_PER_SEC -gt 50 ]; then
    echo "  ✅ 高速（50+ steps/秒）- 最適化成功！"
elif [ $STEPS_PER_SEC -gt 20 ]; then
    echo "  ⚠️ 中速（20-50 steps/秒）- 改善の余地あり"
else
    echo "  ❌ 低速（< 20 steps/秒）- さらなる最適化が必要"
fi

echo "============================================================"


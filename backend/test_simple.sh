#!/bin/bash

echo "🚀 シンプルパフォーマンステスト"
echo "============================================================"

# エピソード作成
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8000/episodes \
  -H "Content-Type: application/json" \
  -d '{"shape": "circle", "seed": 1234, "n_robot": 10, "r_sense": 0.4, "r_avoid": 0.1, "nhn": 6, "nhc": 80, "grid_size": 64, "l_cell": 1.0}')

EPISODE_ID=$(echo $CREATE_RESPONSE | grep -o '"episode_id":"[^"]*"' | cut -d'"' -f4)
echo "✅ エピソードID: $EPISODE_ID"

# 学習開始（1エピソード、50ステップのみ）
echo "📝 学習開始（1エピソード × 50ステップ）..."
START_TIME=$(date +%s.%N)

curl -s -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d "{\"episode_id\": \"$EPISODE_ID\", \"episodes\": 1, \"episode_len\": 50, \"use_llm\": false}" > /dev/null

# 5秒待機（学習完了を待つ）
sleep 5

# ストリームから最新イベントを取得
echo "📊 ストリームから進捗を確認..."
timeout 5s curl -s -N "http://localhost:8000/stream?episode_id=$EPISODE_ID" | grep "episode_end" | head -1

END_TIME=$(date +%s.%N)
ELAPSED=$(echo "$END_TIME - $START_TIME" | bc)

printf "\n⏱️  実行時間: %.2f秒\n" $ELAPSED
STEPS_PER_SEC=$(echo "scale=1; 50 / $ELAPSED" | bc)
echo "⚡ 処理速度: ${STEPS_PER_SEC} steps/秒"


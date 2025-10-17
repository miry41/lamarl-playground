#!/bin/bash

echo "🚀 パフォーマンステスト v2 開始"
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

START_TIME=$(date +%s.%N)

TRAIN_RESPONSE=$(curl -s -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d "{
    \"episode_id\": \"$EPISODE_ID\",
    \"episodes\": 2,
    \"episode_len\": 100,
    \"use_llm\": false
  }")

echo "✅ 学習タスク開始: $TRAIN_RESPONSE"

# 3. 進捗監視（120秒タイムアウト、エピソード終了を2回待つ）
echo ""
echo "📝 Step 3: 進捗監視中（2エピソード完了まで待機、最大120秒）..."

EPISODE_COUNT=0
timeout 120s curl -s -N "http://localhost:8000/stream?episode_id=$EPISODE_ID" | \
  while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      # episode_endイベントをカウント
      if echo "$line" | grep -q '"type":"episode_end"'; then
        EPISODE_NUM=$(echo "$line" | grep -o '"episode":[0-9]*' | cut -d':' -f2)
        M1=$(echo "$line" | grep -o '"M1":[0-9.]*' | cut -d':' -f2)
        M2=$(echo "$line" | grep -o '"M2":[0-9.]*' | cut -d':' -f2)
        echo "  🏁 Episode $EPISODE_NUM 終了: M1=$M1, M2=$M2"
        EPISODE_COUNT=$((EPISODE_COUNT + 1))
        
        if [ $EPISODE_COUNT -ge 2 ]; then
          echo "  ✅ 全エピソード完了"
          break
        fi
      fi
      
      # metricsイベントを10回ごとに表示
      if echo "$line" | grep -q '"type":"metrics_update"'; then
        STEP=$(echo "$line" | grep -o '"step":[0-9]*' | cut -d':' -f2)
        if [ $((STEP % 50)) -eq 0 ]; then
          M1=$(echo "$line" | grep -o '"M1":[0-9.]*' | cut -d':' -f2)
          M2=$(echo "$line" | grep -o '"M2":[0-9.]*' | cut -d':' -f2)
          echo "  📊 Step $STEP: M1=$M1, M2=$M2"
        fi
      fi
    fi
  done

END_TIME=$(date +%s.%N)
ELAPSED=$(echo "$END_TIME - $START_TIME" | bc)

# 4. 結果サマリー
echo ""
echo "============================================================"
echo "📊 パフォーマンステスト結果"
echo "============================================================"
printf "⏱️  実行時間: %.2f秒\n" $ELAPSED
echo "💡 理論値:"
echo "  - 総ステップ数: 200 = 2 ep × 100 steps"
echo "  - 処理速度目標: 50+ steps/秒"
STEPS_PER_SEC=$(echo "scale=1; 200 / $ELAPSED" | bc)
echo "⚡ 実測処理速度: ${STEPS_PER_SEC} steps/秒"

# 性能評価
if (( $(echo "$STEPS_PER_SEC > 50" | bc -l) )); then
    echo "  ✅ 高速（50+ steps/秒）- 最適化成功！"
elif (( $(echo "$STEPS_PER_SEC > 20" | bc -l) )); then
    echo "  ⚠️ 中速（20-50 steps/秒）- 改善の余地あり"
else
    echo "  ❌ 低速（< 20 steps/秒）- さらなる最適化が必要"
fi

echo "============================================================"


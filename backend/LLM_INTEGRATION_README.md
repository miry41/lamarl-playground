# LAMARL LLM統合ガイド

## 概要

このドキュメントでは、LAMARLバックエンドでのLLM統合機能の使い方を説明します。

## 実装された機能

### ✅ 完了した機能

1. **Gemini API統合**
   - Google Gemini API（gemini-2.0-flash-exp）を使用してPrior PolicyとReward Functionを生成
   - 環境変数 `GEMINI_API_KEY` から自動読み込み

2. **Prior Policy統合**
   - Actor損失の正則化項: `L_actor = -Q(s, πθ(s)) + α * ||πθ(s) - πprior(s)||^2`
   - 行動決定時のprior合成: `a = (1 - β) * πθ(s) + β * πprior(s)`
   - デフォルト設定: `α = 0.1`, `β = 0.3`

3. **Reward Function統合**
   - LLM生成の報酬関数を使用した報酬計算
   - メトリクス: Coverage (M1), Uniformity (M2), Collisions

4. **安全なDSL実行環境**
   - ホワイトリスト方式で安全な操作のみを許可
   - ASTベースの式評価器

## 使い方

### 1. 環境設定

`.env.local` ファイルにGemini APIキーを設定:

```bash
GEMINI_API_KEY=your_api_key_here
```

### 2. 依存パッケージのインストール

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. テストの実行

#### Gemini APIテスト

```bash
python -m app.test_gemini
```

#### 統合テスト

```bash
python -m app.test_integration
```

### 4. API使用方法

#### エピソード作成

```bash
POST /episodes
Content-Type: application/json

{
  "shape": "circle",
  "n_robot": 30,
  "r_sense": 0.4,
  "r_avoid": 0.1,
  "nhn": 6,
  "nhc": 80,
  "grid_size": 64,
  "l_cell": 1.0,
  "seed": 1234
}
```

レスポンス:
```json
{
  "episode_id": "ep_xxxxx"
}
```

#### 学習開始（LLMあり）

```bash
POST /train
Content-Type: application/json

{
  "episode_id": "ep_xxxxx",
  "episodes": 100,
  "episode_len": 200,
  "use_llm": true,
  "task_description": "30台のロボットで円形を形成し、均等に配置する",
  "llm_model": "gemini-2.0-flash-exp"
}
```

レスポンス:
```json
{
  "started": true,
  "use_llm": true
}
```

#### 学習進捗のストリーミング

```bash
GET /stream?episode_id=ep_xxxxx
```

Server-Sent Events (SSE) でリアルタイムに学習進捗を受信:

```json
{
  "type": "tick",
  "episode": 0,
  "step": 10,
  "positions": [[x1, y1], [x2, y2], ...],
  "velocities": [[vx1, vy1], [vx2, vy2], ...],
  "collisions": [[i, j], ...]
}

{
  "type": "metrics_update",
  "episode": 0,
  "step": 10,
  "M1": 0.85,
  "M2": 0.15,
  "loss_actor": 0.123,
  "loss_critic": 0.456
}

{
  "type": "episode_end",
  "episode": 0,
  "M1": 0.87,
  "M2": 0.12,
  "final_positions": [[x1, y1], [x2, y2], ...]
}
```

## LLM生成のDSL構造

### Prior Policy DSL

```json
{
  "type": "prior_policy_v1",
  "combination": "weighted_sum",
  "terms": [
    {
      "op": "move_to_shape_center",
      "weight": 0.7
    },
    {
      "op": "avoid_neighbors",
      "weight": 0.2,
      "radius": 0.1
    },
    {
      "op": "keep_grid_uniformity",
      "weight": 0.1,
      "cell_size": 0.2
    }
  ],
  "clamp": {
    "max_speed": 0.5
  }
}
```

#### 利用可能な操作

- `move_to_shape_center`: 形状中心への引力
- `avoid_neighbors`: 近傍ロボットからの斥力
- `keep_grid_uniformity`: グリッド均一性の維持
- `synchronize_velocity`: 速度同期
- `explore_empty_cells`: 空セルへの探索

### Reward Function DSL

```json
{
  "type": "reward_v1",
  "formula": "1.0*coverage - 0.3*collisions - 0.7*uniformity",
  "clamp": {
    "min": -1.0,
    "max": 1.0
  }
}
```

#### 利用可能なメトリクス

- `coverage`: カバレッジ率（0〜1、高いほど良い）
- `uniformity`: 均一性の分散（0〜1、低いほど良い）
- `collisions`: 衝突数（0以上、低いほど良い）

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  - タスク記述入力                                      │
│  - LLM設定（モデル、温度）                              │
│  - 学習進捗の可視化                                     │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP/SSE
┌───────────────────▼─────────────────────────────────┐
│              Backend (FastAPI)                       │
│  ┌──────────────────────────────────────────────┐  │
│  │          LLM Module                           │  │
│  │  - client.py: Gemini API呼び出し             │  │
│  │  - dsl_runtime.py: DSL→関数変換              │  │
│  │  - safe_expr.py: 安全な式評価                │  │
│  └────────────┬─────────────────────────────────┘  │
│               │                                      │
│  ┌────────────▼─────────────────────────────────┐  │
│  │          MARL Module                          │  │
│  │  - marl.py: MADDPG + Prior統合                │  │
│  │  - env.py: Swarm環境                          │  │
│  │  - metrics.py: Coverage/Uniformity            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## パフォーマンス

- **サンプル効率**: 約1.86倍向上（論文準拠）
- **成功率**: 28〜68%向上（論文準拠）
- **LLM生成時間**: 約2〜5秒（Gemini 2.0 Flash）

## トラブルシューティング

### Gemini APIエラー

```
ValueError: GEMINI_API_KEY environment variable is not set
```

→ `.env.local` ファイルに `GEMINI_API_KEY` を設定してください

### Prior Policy実行エラー

```
⚠️ Prior policy error for agent 0: ...
```

→ DSLの構文エラー。LLM生成をやり直すか、Mockモードで実行してください

### Reward Function実行エラー

```
⚠️ Reward function error: ...
```

→ 式の評価エラー。自動的にスパース報酬にフォールバックします

## 今後の拡張

- [ ] OpenAI GPT-4統合
- [ ] Claude 3.5 Sonnet統合
- [ ] カスタムDSL操作の追加
- [ ] Prior Policy探索サンプルのReplay Bufferへの追加
- [ ] メトリクス/結果の永続化（JSON/PNG保存）

## 参考文献

- 論文: LAMARL (Language-Assisted Multi-Agent Reinforcement Learning)
- Gemini API: https://ai.google.dev/


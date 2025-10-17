# バックエンド駆動のUI実装

## 📋 概要

フロントエンドの可視化がバックエンドから送信される**実際の学習データ**を使用するように変更しました。

### 🎯 目的

- ✅ **バックエンドを唯一の真実の情報源（Single Source of Truth）とする**
- ✅ **フロントエンドの状態とバックエンドの実際の学習状態の不一致を防ぐ**
- ✅ **形状選択がUIに正しく反映される**

---

## 🔧 実装の詳細

### 1. バックエンド: SSEイベントに環境設定を追加

#### ファイル: `backend/app/main.py`

学習開始時に環境設定を送信する新しいSSEイベント `env_config` を追加：

```python
async def _train_loop(ep_id: str):
    # ... 既存のコード ...
    
    # ---- SSE イベント: 環境設定を最初に送信 ----
    store["metrics"]["timeline"].append({
        "type": "env_config",
        "shape": cfg.shape,
        "n_robot": cfg.n_robot,
        "r_sense": cfg.r_sense,
        "r_avoid": cfg.r_avoid,
        "n_hn": cfg.n_hn,
        "n_hc": cfg.n_hc,
        "grid_size": env.grid_size,
        "l_cell": env.l_cell,
        "use_llm": store.get("use_llm", False),
    })
```

**送信タイミング**: 学習ループ開始時（最初のステップより前）

---

### 2. フロントエンド: SSEイベントの型定義

#### ファイル: `frontend/src/api/client.ts`

新しいSSEイベント型を追加：

```typescript
export interface SSEEnvConfigEvent {
  type: 'env_config'
  shape: string
  n_robot: number
  r_sense: number
  r_avoid: number
  n_hn: number
  n_hc: number
  grid_size: number
  l_cell: number
  use_llm: boolean
}

export type SSEEvent = SSETickEvent | SSEMetricsEvent | SSEEpisodeEndEvent | SSEEnvConfigEvent
```

---

### 3. フロントエンド: SSEイベントの処理

#### ファイル: `frontend/src/store/useMARLStore.ts`

`env_config` イベントを受信して `episodeConfig` を更新：

```typescript
_handleSSEEvent: (event: SSEEvent) => {
  const state = get()

  switch (event.type) {
    case 'env_config': {
      // バックエンドからの環境設定を受信して更新
      console.log('🌍 Received env_config from backend:', event)
      set({
        episodeConfig: {
          shape: event.shape,
          n_robot: event.n_robot,
          r_sense: event.r_sense,
          r_avoid: event.r_avoid,
          n_hn: event.n_hn,
          n_hc: event.n_hc,
          grid_size: event.grid_size,
          l_cell: event.l_cell,
          seed: state.episodeConfig.seed || 1234,
        }
      })
      break
    }
    
    // ... 他のイベント処理 ...
  }
}
```

---

### 4. フロントエンド: LLMタブとMARLタブの連携

#### ファイル: `frontend/src/components/features/marl/MARLModuleRefactored.tsx`

学習開始時にLLMタブの設定を使ってエピソードを再作成：

```typescript
const handleToggleTraining = async () => {
  if (isTraining) {
    await stopTraining()
  } else {
    // LLMタブの設定を取得
    const llmStore = (await import('@/store/useLLMStore')).useLLMStore.getState()
    const llmConfig = llmStore.request
    
    // LLMタブの設定でエピソードを再作成（バックエンドに正しい設定を送信）
    console.log('🔄 Creating episode with LLM config:', llmConfig)
    await createNewEpisode({
      shape: llmConfig.shape,
      n_robot: llmConfig.n_robot,
      r_sense: llmConfig.r_sense,
      r_avoid: llmConfig.r_avoid,
      n_hn: llmConfig.n_hn,
      n_hc: llmConfig.n_hc,
    })
    
    // ... 学習開始 ...
  }
}
```

---

## 📊 データフロー

```
┌─────────────┐
│  LLM Tab    │
│ (UI Input)  │
└──────┬──────┘
       │
       │ 1. User selects shape
       │    (e.g., circle → square)
       ▼
┌─────────────────┐
│ useLLMStore     │
│ .request.shape  │
└──────┬──────────┘
       │
       │ 2. Training start
       │    (createNewEpisode with LLM config)
       ▼
┌──────────────────┐
│  Backend API     │
│  POST /episode   │
└──────┬───────────┘
       │
       │ 3. Environment created
       │    with specified shape
       ▼
┌──────────────────┐
│  Backend         │
│  SwarmEnv        │
│  .mask (shape)   │
└──────┬───────────┘
       │
       │ 4. SSE: env_config
       │    { shape: "square", ... }
       ▼
┌──────────────────┐
│  useMARLStore    │
│  .episodeConfig  │
└──────┬───────────┘
       │
       │ 5. React re-render
       ▼
┌──────────────────┐
│ RobotVisualization│
│ shape={episodeConfig.shape}
│ ✅ Shows SQUARE!  │
└──────────────────┘
```

---

## 🎯 結果

### ✅ Before (問題)

```
LLM Tab: User selects "square"
  ↓
MARL Tab: Still shows "circle" (not updated)
  ↓
UI: ❌ Wrong shape displayed
```

### ✅ After (修正後)

```
LLM Tab: User selects "square"
  ↓
Backend: Creates env with square shape
  ↓
SSE: Sends env_config { shape: "square" }
  ↓
MARL Tab: Updates to "square"
  ↓
UI: ✅ Correct shape displayed
```

---

## 🧪 テスト手順

1. **LLMタブを開く**
   - Environment Setup セクション
   - Shape プルダウンで "Circle" を選択

2. **MARLタブに移動**
   - "▶ Start Training" ボタンをクリック

3. **結果確認**
   - ✅ 可視化エリアに**円形のマス**が表示される
   - ✅ コンソールに `🌍 Received env_config from backend: { shape: 'circle', ... }` が表示される

4. **形状を変更**
   - "⏹ Stop Training" をクリック
   - LLMタブに戻る
   - Shape を "Square" に変更
   - MARLタブに戻る
   - "▶ Start Training" をクリック

5. **結果確認**
   - ✅ 可視化エリアに**正方形のマス**が表示される
   - ✅ コンソールに `🌍 Received env_config from backend: { shape: 'square', ... }` が表示される

---

## 📝 重要なポイント

### 1. **バックエンドが唯一の情報源**
- フロントエンドは表示のみを担当
- すべての環境設定はバックエンドから取得

### 2. **SSEによるリアルタイム同期**
- 学習開始時に `env_config` イベントを送信
- フロントエンドは受信した設定で状態を更新

### 3. **エピソード再作成**
- 形状を変更したら新しいエピソードを作成
- バックエンドに正しい設定を送信

### 4. **型安全性**
- TypeScript で SSEイベントの型を定義
- コンパイル時にエラーを検出

---

## 🔍 デバッグ方法

### コンソールログを確認

```javascript
// 1. エピソード作成
"🔄 Creating episode with LLM config: { shape: 'square', ... }"

// 2. SSEイベント受信
"🌍 Received env_config from backend: { shape: 'square', ... }"

// 3. 可視化更新
// RobotVisualization が再レンダリングされる
```

### ネットワークタブを確認

1. **POST /episode**
   - Request Body: `{ "shape": "square", ... }`
   - Response: `{ "episode_id": "..." }`

2. **GET /stream?episode_id=...**
   - SSE Stream
   - 最初のイベント: `data: {"type":"env_config","shape":"square",...}`

---

## 🎉 完了！

**形状選択がバックエンドから正しく反映されるようになりました！**

これで、LLMタブで選択した形状が、実際の学習環境とUIの可視化の両方に正しく適用されます。

---

## ✅ 動作検証

### バックエンド: 形状マスク生成確認

```bash
$ cd backend && source .venv/bin/activate
$ python -c "from app.shapes import grid_mask; import numpy as np; ..."

🔍 Shape mask verification:

  circle    :  797 cells
  square    : 1156 cells
  triangle  :  302 cells
  L         :  252 cells
  A         :  624 cells
  M         :  632 cells
  R         :  516 cells

✅ All shapes generate valid masks!
```

### フロントエンド: SSEイベント確認

ブラウザのコンソールに以下のログが表示されます：

```
🔄 Creating episode with LLM config: { shape: 'square', n_robot: 30, ... }
✅ Episode created: abc12345
🌍 Received env_config from backend: { type: 'env_config', shape: 'square', ... }
✅ Training started: abc12345 with LLM: true
```

---

## 🚀 今後の拡張

この実装により、以下のような拡張が容易になります：

1. **動的なパラメータ変更**
   - 学習中にパラメータを変更してSSEで送信
   - リアルタイムで可視化を更新

2. **複数環境の並列実行**
   - 異なる形状の環境を同時に実行
   - それぞれのSSEストリームで独立して更新

3. **環境状態の保存/復元**
   - バックエンドから完全な状態を取得
   - フロントエンドで正確に再現

4. **詳細な診断情報**
   - 環境の内部状態をSSEで送信
   - デバッグやモニタリングに活用


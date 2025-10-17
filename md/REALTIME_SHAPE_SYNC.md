# リアルタイム形状同期実装

## 🎯 要件

**LLMタブのプルダウンで形状を選択した瞬間に、MARLタブの可視化も即座に変わる**

---

## ✅ 実装方法

### Zustand の `subscribe` を使用してリアルタイム監視

**ファイル**: `frontend/src/components/features/marl/MARLModuleRefactored.tsx`

```typescript
// LLMタブの設定を常に監視して、MARLタブの形状を同期
useEffect(() => {
  import('@/store/useLLMStore').then(({ useLLMStore }) => {
    // 1. 初期設定を即座に反映
    const llmConfig = useLLMStore.getState().request
    setEpisodeConfig({
      shape: llmConfig.shape,
      n_robot: llmConfig.n_robot,
      r_sense: llmConfig.r_sense,
      r_avoid: llmConfig.r_avoid,
      n_hn: llmConfig.n_hn,
      n_hc: llmConfig.n_hc,
    })
    
    // 2. エピソードがない場合は作成
    if (!episodeId) {
      createNewEpisode({ ...llmConfig })
    }
    
    // 3. LLMタブの設定変更を監視（リアルタイム）
    const unsubscribe = useLLMStore.subscribe((state) => {
      const newConfig = state.request
      console.log('🎨 LLM config changed, updating MARL tab:', newConfig.shape)
      
      // MARLタブの episodeConfig を即座に更新
      setEpisodeConfig({
        shape: newConfig.shape,
        n_robot: newConfig.n_robot,
        r_sense: newConfig.r_sense,
        r_avoid: newConfig.r_avoid,
        n_hn: newConfig.n_hn,
        n_hc: newConfig.n_hc,
      })
    })
    
    // 4. クリーンアップ
    return unsubscribe
  })
}, [])
```

---

## 📊 動作フロー

```
┌─────────────────────────────────────────────────────────────┐
│ ステップ1: ページロード                                      │
├─────────────────────────────────────────────────────────────┤
│ MARLタブマウント                                             │
│   ↓                                                          │
│ useEffect 実行                                               │
│   ↓                                                          │
│ LLMStore.request 取得                                        │
│   ↓                                                          │
│ setEpisodeConfig({ shape: "circle", ... })                  │
│   ↓                                                          │
│ RobotVisualization re-render                                │
│   ↓                                                          │
│ ● (circle) 表示                                              │
│   ↓                                                          │
│ useLLMStore.subscribe() 登録 🔔                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ステップ2: ユーザーがLLMタブでプルダウン変更                 │
├─────────────────────────────────────────────────────────────┤
│ LLM Tab: Shape プルダウンで "square" 選択                    │
│   ↓                                                          │
│ useLLMStore.setRequest({ shape: "square" })                 │
│   ↓                                                          │
│ Zustand が状態変更を検知 🔔                                  │
│   ↓                                                          │
│ subscribe コールバック実行（MARLタブ側）                     │
│   ↓                                                          │
│ setEpisodeConfig({ shape: "square", ... })                  │
│   ↓                                                          │
│ RobotVisualization re-render                                │
│   ↓                                                          │
│ ■ (square) 表示 ⚡ 即座！                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ステップ3: 学習開始                                          │
├─────────────────────────────────────────────────────────────┤
│ "▶ Start Training" クリック                                  │
│   ↓                                                          │
│ 既に episodeConfig.shape = "square" ✅                       │
│   ↓                                                          │
│ startTraining() → バックエンドに送信                         │
│   ↓                                                          │
│ SSE: env_config { shape: "square" }                         │
│   ↓                                                          │
│ 検証: "square" == "square" ✅                                │
│   ↓                                                          │
│ 何もしない（再レンダリング不要）                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 ユーザー体験

### Before（改善前）
```
1. LLM Tab: "square" 選択
2. MARL Tab: まだ ● (circle)
3. "Start Training" クリック
4. 学習開始
5. やっと ■ (square) が表示 ❌ 遅い
```

### After（改善後）
```
1. LLM Tab: "square" 選択
2. ⚡ 即座に MARL Tab も ■ (square) に変わる ✅
3. "Start Training" クリック
4. 学習開始（形状は既に正しい）
```

---

## 📝 コンソールログ

### ページロード
```
🔄 Creating initial episode with shape: circle
✅ Episode created: ep-xxx
🎨 UI updated: shape = circle
```

### LLMタブでプルダウン変更（リアルタイム）
```
(LLM Tab で "square" を選択)

🎨 LLM config changed, updating MARL tab: square
🎨 UI updated: shape = square  ← 即座に更新！
```

```
(LLM Tab で "triangle" を選択)

🎨 LLM config changed, updating MARL tab: triangle
🎨 UI updated: shape = triangle  ← 即座に更新！
```

### 学習開始
```
▶️ Starting training with shape: square
✅ Training started: ep-xxx with LLM: true
✅ env_config verified: shape matches ( square )
```

---

## 🔑 ポイント

### 1. **Zustand の `subscribe` を活用**
```typescript
const unsubscribe = useLLMStore.subscribe((state) => {
  // 状態が変わるたびに呼ばれる
  setEpisodeConfig({ shape: state.request.shape, ... })
})

// クリーンアップ
return unsubscribe
```

### 2. **双方向同期ではない（単方向）**
```
LLM Tab → MARL Tab ✅（常に同期）
LLM Tab ← MARL Tab ❌（同期しない）
```

MARL TabはLLM Tabの設定を**受動的に反映**するだけ。

### 3. **学習開始時にエピソード再作成不要**
```typescript
// Before（改善前）
const handleToggleTraining = async () => {
  await createNewEpisode({ shape: llmConfig.shape })  // ❌ 不要
  await startTraining()
}

// After（改善後）
const handleToggleTraining = async () => {
  await startTraining()  // ✅ episodeConfig は既に正しい
}
```

### 4. **初回マウント時も即座に反映**
```typescript
// 初期設定を取得
const llmConfig = useLLMStore.getState().request
setEpisodeConfig({ shape: llmConfig.shape, ... })  // 即座に反映

// その後、監視を開始
const unsubscribe = useLLMStore.subscribe(...)
```

---

## 🧪 テスト方法

1. **ページをリロード**
   - MARL Tab を開く
   - デフォルトの ● (circle) が表示される ✅

2. **LLM Tab に移動**
   - Shape プルダウンで "Square" を選択

3. **MARL Tab に戻る**
   - **即座に ■ (square) が表示されている** ⚡ ✅

4. **LLM Tab で形状を変更しまくる**
   - Circle → Square → Triangle → L → ...
   - **MARL Tab を見ながら変更する**
   - **即座に形状が変わる** ⚡ ✅

5. **学習を開始**
   - "▶ Start Training" クリック
   - 形状は変わらない（既に正しい）✅
   - コンソール: `✅ env_config verified: shape matches`

---

## 🎉 まとめ

**`useLLMStore.subscribe()` でリアルタイム監視し、MARLタブの形状を即座に同期**

- ✅ **プルダウン変更と同時に形状が変わる**（リアルタイム）
- ✅ **学習開始前から正しい形状が表示される**
- ✅ **学習開始時にエピソード再作成不要**（効率的）
- ✅ **UXが大幅に向上**（直感的）

最高のリアルタイム同期！ 🚀


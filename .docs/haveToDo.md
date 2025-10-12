# backend 実装チェック結果

## 🔴 **最優先で修正が必要な問題**

### 1. Prior Policy 統合が未実装（LAMARL の核心機能）

論文の最も重要な特徴である Prior Policy の統合が実装されていません。

#### 問題箇所と必要な修正:

**① Actor 損失の正則化項が欠落** (`marl.py:91`)
```python
# 現在の実装
loss_a = - self.critic(torch.cat([obs, a], dim=1)).mean()

# 必要な実装（論文 d3_marlModule.md 参照）
# Lactor = -Qφ(s, πθ(s)) + α * || πθ(s) - πprior(s) ||^2
```

**② 行動決定時の prior 合成がない** (`marl.py:52-62`)
```python
# 論文 d3_marlModule.md L78-80
# a = (1 - β) * πθ(s) + β * πprior(s)
```

**必要な作業:**
- `MADDPGAgent.update()` に `prior_action` パラメータと `alpha_prior` 重みを追加
- `MADDPGAgent.act()` に `prior_policy` 関数と `beta` 融合係数を追加
- `MADDPGSystem` に prior_policy 関数を保持・適用する仕組みを追加

---

### 2. 報酬関数が固定（LLM 生成を統合できない）

**現在の実装** (`main.py:179-180`)
```python
done = 1.0 if (M1 > 0.8 and M2 < 0.2) else 0.0
rew_scalar = 1.0 if done == 1.0 else 0.0
```

**問題点:**
- スパース報酬のみ（成功/失敗の2値）
- LLM生成の `reward_function(global_state)` を差し替えるフックがない

**推奨対応:**
- `store["reward_fn"]` として報酬関数を保持できるようにする
- デフォルトは現在のスパース報酬、LLM生成後は差し替え可能に

---

### 3. 結果保存が未実装

**ドキュメント要求** (`d4_evaluation.md`)
- `metrics.json` の保存（M1/M2 の推移データ）
- `final_shape.png` の保存（最終配置のスクリーンショット）

**現状:**
- SSE でイベントを流すだけで永続化されない
- `_train_loop()` の L216-222 が未完成

**必要な作業:**
- エピソード終了時に JSON とPNG を保存
- PIL で可視化画像を生成（ロボット位置 + 形状マスク）

---

## 🟠 **軽微な問題（動作には影響しない）**

### 4. 観測のスケール調整が曖昧

**該当箇所** (`env.py:63`)
```python
if dist[j] <= self.rs * self.grid_size/8 and cnt < self.nhn:
```

**問題点:**
- `grid_size/8` という経験的係数の意図が不明
- 物理単位（m）とグリッド座標の対応が文書化されていない

**推奨対応:**
- コメントでスケール変換の理由を明記
- または `r_sense_grid = self.rs * (self.grid_size / physical_size)` のように明示的に計算

---

### 5. ハイパーパラメータのハードコード

**該当箇所** (`marl.py:4`)
```python
def mlp(in_dim, out_dim, hidden=[180,180,180], out_act=None):
```

**現状:**
- hidden_dim=180, hidden_layers=3 が固定
- ドキュメント（d1_env-input.md）では可変パラメータとして記載

**対応:**
- ユーザーの指示により「ハイパラは固定でいい」とのことなので現状維持でOK
- 将来的に可変にする場合は `MADDPGAgent.__init__()` で受け取るように変更

---

## ✅ **正常に実装されている部分**

- 環境 (env.py): shape, n_robot, 観測の固定次元化など
- MARL基礎 (marl.py): MADDPG構造、Actor/Critic、Target Network
- 評価指標 (metrics.py): Coverage (M1) と Uniformity (M2)
- 形状生成 (shapes.py): circle, L, A, M, R など
- Replay Buffer (buffer.py): シンプルで正常
- API構造 (main.py): FastAPI + SSE の枠組み

---

## 📋 修正優先度まとめ

| 優先度 | 項目 | 影響 |
|--------|------|------|
| 🔴 最高 | Prior Policy 統合 | LAMARL の本質的機能が欠落 |
| 🟡 高 | 報酬関数の可変化 | LLM統合時に必要 |
| 🟡 高 | 結果保存の実装 | 評価・デバッグに必要 |
| 🟠 低 | スケール調整の文書化 | 可読性向上 |
| 🟠 低 | ハイパラの可変化 | 現状は不要（固定でOK） |

---

## 🚀 次のステップ

1. **即座に修正**: main.py L216 のエラー修正
2. **LAMARL実装**: Prior Policy 統合（α正則化 + β合成）
3. **結果保存**: metrics.json / final_shape.png の出力
4. **LLM準備**: reward_function の差し替え可能な設計

バックエンド単体での動作確認には **1と2** が必須です。

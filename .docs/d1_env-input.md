# 🔁 全体の処理フロー（上から下へ）

---

## ① タスク／環境入力（Environment）

- **shape（string）**: `"square" | "circle" | "image" | "L" | "A" | "M" | "R" | "L"`
- **n_robot（int）**: 例 `30`
- **r_sense（float, m）**: 例 `0.4`（感知半径）
- **r_avoid（float, m）**: 例 `0.1`（衝突回避半径）
- **n_hn（int）**: 例 `6`（近傍ロボットの上限）
- **n_hc（int）**: 例 `80`（観測セルの上限）
- **入力チェック（自動）**:  
  `4 * n_robot * r_avoid^2 ≤ n_cell * l_cell^2`  
  （領域に収容可能かの幾何条件）

---

## ② LLMモジュール入力（Function Generation）

### 入力する値
- **shape（string）**
- **n_robot（int）**
- **r_sense（float, m）**
- **r_avoid（float, m）**
- **n_hn（int）**
- **n_hc（int）**

### タスク命令
- **instruction（string）**: タスクの自然言語指示（例: `"30台で円を形成"`）
- **use_cot（boolean）**: 例 `true`（思考過程でタスク分解）
- **use_basic_apis（boolean）**: 例 `true`（提供APIを前提にコード生成）

### 出力
- **Python関数文字列**
  - `prior_policy(state)`
  - `reward_function(global_state)`

---

## ③ MARL（MADDPG）学習設定

- **episodes（int）**: `3000`
- **episode_len（int）**: `200`
- **batch_size（int）**: `512`
- **hidden_dim（int）**: `180`
- **hidden_layers（int）**: `3`
- **lr_actor（float）**: `1e-4`
- **lr_critic（float）**: `1e-3`
- **exploration_rate（float 0–1）**: `0.6`
- **noise_scale（float）**: `0.1`
- **gamma（float）**: `0.99`
- **critic_mode（string）**: `"local"`（Q入力を各エージェントの観測・行動のみに修正）
- **alpha_prior（float）**:  
  俳優目的を `maximize Q − α ||a − a_prior||^2` に変更する重み（数値は実装側で設定）

---

## ④ 観測／行動インタフェース（生成関数が依拠する前提）

- **行動**: 各ロボットは2次元ベクトル `(x, y)` を出す  
- **観測**:  
  - 近傍ロボット（最大 `n_hn`）と観測セル（最大 `n_hc`）をまとめた固定次元ベクトル  
  - `r_sense` 内に対象が少なければゼロ埋め、多ければ間引きで上限に合わせる  

---


## 🧩 固定部分と LLMに投げる部分の対応表

| カテゴリ | 項目 | 誰が決める？ | LLMに送る？ | 内容・例 |
|-----------|------|---------------|---------------|-----------|
| **環境設定** | `shape`, `n_robot`, `r_sense`, `r_avoid`, `n_hn`, `n_hc` | ✅ ユーザ入力 | ✅ 一部送る | タスク文脈を理解させるため、「こういう環境ですよ」と説明文だけ渡す（コードは固定） |
| **観測と行動API** | `get_neighbors()`, `get_distance()`, `state.pos` など | ⚙️ 固定（実装側） | ❌ 送らない（仕様だけ教える） | LLMは「こういうAPIがある」とだけ知ってコードに使う。実体はサーバ側にある。 |
| **タスク命令** | `"30台で円を形成せよ"` | ✅ ユーザ入力 | ✅ 送る | LLMが思考（CoT）・報酬設計・prior設計を行うための中心情報 |
| **LLM設定** | `use_cot`, `use_basic_apis`, `model`, `temperature` | ⚙️ 固定またはUI指定 | ✅ 送る | 生成の制御フラグ。CoT有効化など。 |
| **MARLハイパーパラメータ** | `episodes`, `lr_actor`, `gamma`, etc. | ⚙️ 固定（実験条件） | ❌ 送らない | 学習アルゴリズムの設定。LLMには関係なし。 |
| **α（Prior重み）** | `alpha_prior` | ⚙️ 固定（学習側） | ❌ 送らない | LLM出力のpriorをどれだけ信頼するか。MARL内で扱う。 |
| **報酬関数／ポリシー** | `def prior_policy(state): ...` / `def reward_function(state): ...` | 🤖 LLMが生成 | ✅ LLM出力 | LAMARLの中核。LLMがこれを返す。 |
| **環境シミュレータ** | `env.step(action)` | ⚙️ 固定（実装側） | ❌ 送らない | 物理的挙動や衝突判定などは実装で用意。 |
| **学習ループ（MADDPG）** | `train_actor_critic(buffer)` | ⚙️ 固定（実装側） | ❌ 送らない | LLMは介入しない。RLエンジンとして動く。 |


## 処理フロー（上から下へ）

```text
┌────────────────────────────┐
│        ① ユーザ入力         │
│ shape, n_robot, タスク説明  │
│ 例: 「30台で円を形成せよ」   │
└────────────┬───────────────┘
               │
               ▼
┌───────────────────────────────┐
│        ② LLMモジュール         │
│ タスク説明 + 環境情報 + API仕様 │
│ CoT推論で                     │
│ prior_policy(),               |
| reward_function() 生成        │
└────────────┬──────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│       ③ MARLモジュール              │
│ LLM生成関数を読み込み学習開始        │
│ 固定のMADDPGループで訓練             │
│ Actor: Q − α||a−a_prior||² を最適化 │
└────────────────────────────────────┘
'''





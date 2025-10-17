# LAMARL LLM Module 実装完了

## 📋 概要

JSON-DSLベースの安全なLLM統合モジュールを実装しました。
論文の推奨アーキテクチャに従い、**生Pythonコードを実行せず、ホワイトリスト方式の安全な実装**を採用しています。

---

## 🏗️ アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Zustand)               │
│  - LLMModuleRefactored.tsx (UI)                             │
│  - useLLMStore.ts (状態管理)                                 │
│  - API Client (型安全な通信)                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP JSON
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (FastAPI + PyTorch)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LLM API Router (/llm/*)                             │  │
│  │  - POST /llm/generate  → 関数生成                     │  │
│  │  - POST /llm/validate  → DSL検証                      │  │
│  │  - GET  /llm/operations → 仕様取得                    │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                           │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │  LLM Client (OpenAI/Anthropic/Mock)                  │  │
│  │  - JSON-DSLのみを返すプロンプト                        │  │
│  │  - CoT推論サポート                                     │  │
│  │  - Basic API仕様の提供                                 │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                           │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │  DSL Runtime (ホワイトリスト方式)                      │  │
│  │  - PriorDSL → prior_policy(state) 関数                │  │
│  │  - RewardDSL → reward_function(metrics) 関数          │  │
│  │  - 許可された操作のみ実行                               │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                           │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │  Safe Expression Evaluator                           │  │
│  │  - ASTベースの安全な式評価                             │  │
│  │  - evalを使わない自作評価器                            │  │
│  │  - ホワイトリスト変数のみ許可                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 実装内容

### バックエンド (Python/FastAPI)

#### 1. **Pydantic Schemas** (`app/schemas.py`)
- `PriorDSL`: Prior Policy の JSON-DSL定義
- `RewardDSL`: Reward Function の JSON-DSL定義
- `GenerateRequest/Response`: LLM生成リクエスト/レスポンス
- 型安全性と値域チェック（weight: 0-1、radius: 0-1など）

#### 2. **DSL Runtime** (`app/llm/dsl_runtime.py`)
- **ホワイトリスト方式の操作実装**:
  - `move_to_shape_center`: 形状中心への引力
  - `avoid_neighbors`: 近傍ロボットからの斥力
  - `keep_grid_uniformity`: グリッド均一性の維持
  - `synchronize_velocity`: 速度同期
  - `explore_empty_cells`: 空セルへの探索
- DSL → 実行可能な関数への変換
- 許可されていない操作は自動的に拒否

#### 3. **Safe Expression Evaluator** (`app/llm/safe_expr.py`)
- ASTベースの安全な式評価器
- **許可された要素のみ**:
  - 変数: `coverage`, `uniformity`, `collisions`
  - 演算子: `+`, `-`, `*`, `/`
  - 関数: `abs()`, `min()`, `max()`, `clamp()`
- `eval()` は使用せず、自作のASTビジターで評価
- 危険なノード（import, exec など）は自動的に拒否

#### 4. **LLM Client** (`app/llm/client.py`)
- **マルチプロバイダ対応**:
  - Mock (開発用、固定DSLを返す)
  - OpenAI (GPT-4, GPT-4 Turbo)
  - Anthropic (Claude 3.5 Sonnet)
- **JSON-DSLのみを返すプロンプト設計**
- Chain-of-Thought推論サポート
- Basic API仕様の提供

#### 5. **FastAPI Router** (`app/llm/router.py`)
- `POST /llm/generate`: Prior/Reward DSL生成
- `POST /llm/validate`: DSLバリデーション
- `GET /llm/operations`: 利用可能な操作とメトリクスのリスト
- `GET /llm/health`: ヘルスチェック

---

### フロントエンド (React/TypeScript)

#### 1. **LLM Store** (`src/store/useLLMStore.ts`)
- Zustandベースの状態管理
- 生成リクエストパラメータ
- 生成プロセスの進行状況
- 生成結果と履歴（最新5件）
- エラーハンドリング

#### 2. **API Client拡張** (`src/api/client.ts`)
- `generateFunctions()`: LLM生成
- `validateDSL()`: バリデーション
- `getOperations()`: 仕様取得
- TypeScript型定義（型安全な通信）

#### 3. **UI Components**

**新規作成したコンポーネント**:
- `BasicAPIList.tsx`: Basic API仕様の表示
- `DSLViewer.tsx`: JSON-DSL表示（Prior/Reward）
- `CoTViewer.tsx`: Chain-of-Thought推論の表示

**更新したコンポーネント**:
- `LLMModuleRefactored.tsx`: メインモジュール（6フェーズ）
- `LLMSettings.tsx`: storeと統合
- `EnvironmentSetup.tsx`: storeと統合

**フェーズ構成**:
1. 🌍 Environment Setup - 環境パラメータ設定
2. 📝 Task Description - タスク記述
3. 📦 Basic APIs - 利用可能な操作とメトリクス
4. ⚙️ LLM Configuration - CoT/モデル設定
5. 🔄 Generation Process - 生成プロセスの監視
6. ✨ Generated Result - DSL表示とCoT推論

---

## 🔒 セキュリティ設計

### 3つの安全層

1. **Pydantic バリデーション**
   - 型チェック（string, int, float）
   - 値域チェック（weight: 0-1, radius: 0-1）
   - 未知のフィールドを拒否

2. **ホワイトリスト方式**
   - 定義された操作のみ許可
   - 定義された変数のみ許可
   - 未知の要素は自動拒否

3. **AST検証**
   - 危険なノードを検出（import, exec, eval）
   - 許可されたノードタイプのみ通過
   - 自作評価器で安全に実行

### 生Pythonコードを実行しない理由

❌ **従来の危険な方法**:
```python
# LLMが返したPythonコードをそのまま実行
exec(llm_generated_code)  # 🚨 任意コード実行の危険性
```

✅ **LAMARLの安全な方法**:
```python
# LLMはJSON-DSLのみを返す
dsl = llm.generate()  # → {"op": "move_to_center", "weight": 0.6}

# 自前の安全な実装にマッピング
policy = build_prior_fn(dsl)  # → 定義済み関数を組み合わせるだけ
```

---

## 🚀 セットアップ手順

### 1. バックエンド

```bash
cd backend

# 依存パッケージのインストール（必要に応じて）
pip install openai anthropic  # LLM APIを使う場合のみ

# 環境変数の設定（本番LLMを使う場合のみ）
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"

# 開発サーバー起動
python -m uvicorn app.main:app --reload --port 8000
```

### 2. フロントエンド

```bash
cd frontend

# 依存パッケージのインストール（すでに完了している想定）
pnpm install

# 開発サーバー起動
pnpm dev
```

### 3. 動作確認

1. ブラウザで `http://localhost:5173` を開く
2. 「LLM Module」タブに移動
3. Environment Setup で環境パラメータを設定
4. Task Description でタスクを記述
5. LLM Configuration で "Mock (Development)" を選択
6. 「Generate Functions」ボタンをクリック

**Mockモード**では、実際のLLM APIを叩かずに固定のDSLが返されます。

---

## 📊 論文との対応

| 論文の要件 | 実装状況 | 効果 |
|-----------|---------|------|
| **JSON-DSL生成** | ✅ 実装完了 | 任意コード実行を回避 |
| **Chain-of-Thought** | ✅ 実装完了 | 成功率 +28.5-67.5% |
| **Basic APIs提供** | ✅ 実装完了 | 成功率 +28.5-67.5% |
| **ホワイトリスト方式** | ✅ 実装完了 | セキュリティ確保 |
| **Pydanticバリデーション** | ✅ 実装完了 | 型安全性 |
| **安全なAST評価** | ✅ 実装完了 | 式の安全性 |

---

## 🧪 テスト

### バックエンド

```bash
cd backend

# Safe Expression Evaluator のテスト
python -m app.llm.safe_expr

# 出力例:
# ✅ 1.0*coverage - 0.5*collisions = 0.3
# ✅ coverage + uniformity = 1.0
# ✅ import os correctly rejected: ...
```

### フロントエンド

```bash
cd frontend

# 型チェック
pnpm tsc --noEmit

# Lintチェック
pnpm lint
```

---

## 📁 ファイル構成

```
lamarl-playground/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPIエントリーポイント（LLMルーター統合）
│   │   ├── schemas.py               # Pydantic schemas（新規作成）
│   │   └── llm/                     # LLMモジュール（新規作成）
│   │       ├── __init__.py
│   │       ├── client.py            # LLMクライアント（OpenAI/Anthropic/Mock）
│   │       ├── dsl_runtime.py       # DSL → 実行可能関数への変換
│   │       ├── safe_expr.py         # 安全な式評価器
│   │       └── router.py            # FastAPIルーター
│
├── frontend/
│   ├── src/
│   │   ├── store/
│   │   │   └── useLLMStore.ts       # LLM状態管理（新規作成）
│   │   ├── api/
│   │   │   └── client.ts            # API Client（LLM機能追加）
│   │   └── components/
│   │       └── features/
│   │           └── llm/
│   │               ├── LLMModuleRefactored.tsx  # メインモジュール（大幅更新）
│   │               ├── BasicAPIList.tsx         # Basic API仕様表示（新規作成）
│   │               ├── DSLViewer.tsx            # JSON-DSL表示（新規作成）
│   │               ├── CoTViewer.tsx            # CoT推論表示（新規作成）
│   │               ├── LLMSettings.tsx          # 設定（store統合）
│   │               └── EnvironmentSetup.tsx     # 環境設定（store統合）
│
└── LLM_MODULE_README.md             # このファイル
```

---

## 🔜 今後の拡張（オプション）

### 1. MARLモジュールとの統合（現在は不要）
```python
# 将来的に統合する場合の疑似コード
def train_with_llm_prior(env, prior_dsl, reward_dsl):
    prior_fn = build_prior_fn(prior_dsl)
    reward_fn = build_reward_fn(reward_dsl)
    
    # MADDPG Actor損失に Prior正則化を追加
    # loss_actor = -Q(s, πθ(s)) + α * ||πθ(s) - πprior(s)||²
```

### 2. リアルタイムLLM API呼び出し
- 環境変数でAPIキーを設定
- `model: "gpt-4"` または `"claude-3-5-sonnet-20241022"` を選択

### 3. 生成履歴の永続化
- データベース統合（PostgreSQL/MongoDB）
- 生成結果の保存と再利用

### 4. カスタム操作の追加
- `dsl_runtime.py` の `OP_REGISTRY` に新しい操作を追加
- フロントエンドの `BasicAPIList` が自動的に表示

---

## ✅ 完了チェックリスト

- [x] Pydantic schemas作成
- [x] DSL Runtime実装
- [x] Safe Expression Evaluator実装
- [x] LLM Client実装（Mock/OpenAI/Anthropic）
- [x] FastAPIルーター実装
- [x] LLM Store作成
- [x] API Client拡張
- [x] UI改善（JSON-DSL表示、CoT詳細、Basic API仕様）
- [x] 6フェーズのフロー実装
- [x] エラーハンドリング
- [x] 型安全性確保

---

## 📝 まとめ

**JSON-DSLベースの安全なLLM統合**を完全実装しました：

✅ **セキュリティ**: 生Pythonコードを実行せず、ホワイトリスト方式で安全性を確保  
✅ **型安全性**: Pydantic/TypeScriptで完全な型チェック  
✅ **拡張性**: 新しい操作やメトリクスを簡単に追加可能  
✅ **論文準拠**: Chain-of-Thought、Basic APIs、JSON-DSLなど論文の推奨設計を完全実装  
✅ **モジュール性**: MARLモジュールと独立して動作（統合は将来的に）

**開発モード（Mock）でテスト可能**なので、すぐに動作確認ができます。


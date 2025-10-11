# Components Architecture

このディレクトリには、LAMARLプレイグラウンドのUIコンポーネントが含まれています。

## ディレクトリ構造

```
components/
├── ui/                    # 基本的なUIコンポーネント
│   ├── Button.tsx        # ボタンコンポーネント（variant, size, shapeをサポート）
│   ├── Card.tsx          # カードコンポーネント（Header, Content, Titleを含む）
│   ├── Input.tsx         # 入力フィールドコンポーネント
│   ├── Select.tsx        # セレクトボックスコンポーネント
│   ├── Label.tsx         # ラベルコンポーネント
│   └── index.ts          # エクスポート
│
├── common/               # 共通コンポーネント
│   ├── MetricCard.tsx    # メトリクス表示カード
│   ├── BarChart.tsx      # バーチャートコンポーネント
│   ├── MethodComparison.tsx  # メソッド比較表示
│   ├── FormField.tsx     # フォームフィールド（Input/Selectのラッパー）
│   └── index.ts          # エクスポート
│
├── features/             # フィーチャー固有のコンポーネント
│   ├── llm/             # LLMモジュール関連
│   │   ├── ProcessStep.tsx           # プロセスステップ表示
│   │   ├── TaskInput.tsx             # タスク入力フォーム
│   │   ├── ConstraintList.tsx        # 制約リスト表示
│   │   ├── GenerationProgress.tsx    # 生成プログレス表示
│   │   ├── ReviewChecklist.tsx       # レビューチェックリスト
│   │   ├── CodeViewer.tsx            # コードビューア
│   │   ├── LLMModuleRefactored.tsx   # LLMモジュールメイン
│   │   └── index.ts                  # エクスポート
│   │
│   └── marl/            # MARLモジュール関連
│       ├── TrainingControls.tsx      # トレーニングコントロール
│       ├── AlgorithmSettings.tsx     # アルゴリズム設定
│       ├── TrainingParameters.tsx    # トレーニングパラメータ
│       ├── LAMARLFeatures.tsx        # LAMARL機能設定
│       ├── EnvironmentSettings.tsx   # 環境設定
│       ├── PerformanceMetrics.tsx    # パフォーマンスメトリクス表示
│       ├── SampleEfficiency.tsx      # サンプル効率性表示
│       ├── MARLModuleRefactored.tsx  # MARLモジュールメイン
│       └── index.ts                  # エクスポート
│
└── TabInterface.tsx      # タブインターフェース（メインルーター）
```

## 設計原則

### 1. コンポーネントの責務分離
- **ui/**: 汎用的で再利用可能な基本UIコンポーネント
- **common/**: ドメイン固有だが複数のフィーチャーで使える共通コンポーネント
- **features/**: 特定のフィーチャーに紐づいたコンポーネント

### 2. 小さく保つ
- 各コンポーネントは100行以下を目指す
- 単一責任の原則を守る
- 複雑なロジックは分割する

### 3. 型安全性
- すべてのpropsにTypeScript型定義を付与
- `interface`で明示的にpropsを定義

### 4. 再利用性
- `ui/`コンポーネントは完全に汎用的
- `common/`コンポーネントは設定可能なpropsを持つ
- `features/`コンポーネントは特定のユースケースに最適化

## 使用例

### UIコンポーネント

```tsx
import { Button, Card, CardHeader, CardContent, Input } from '@/components/ui'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <h3>タイトル</h3>
      </CardHeader>
      <CardContent>
        <Input placeholder="入力してください" />
        <Button variant="default" size="lg">
          送信
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 共通コンポーネント

```tsx
import { MetricCard, BarChart, MethodComparison } from '@/components/common'

function MyMetrics() {
  return (
    <>
      <MetricCard 
        label="精度" 
        value="95.3%" 
        progressValue={95.3}
        progressColor="bg-green-500"
      />
      <BarChart 
        title="報酬" 
        data={[10, 20, 30, 40]}
        color="bg-blue-500"
      />
    </>
  )
}
```

### フィーチャーコンポーネント

```tsx
import { LLMModuleRefactored } from '@/components/features/llm'
import { MARLModuleRefactored } from '@/components/features/marl'

function App() {
  return (
    <div>
      <LLMModuleRefactored />
      <MARLModuleRefactored />
    </div>
  )
}
```

## スタイリング

- **TailwindCSS**: すべてのスタイリングに使用
- **class-variance-authority**: バリアントベースのスタイリング（Buttonなど）
- **tailwind-merge**: クラス名の衝突を回避

## リファクタリングの効果

### Before
- **LLMModule**: 267行（単一ファイル）
- **MARLModule**: 298行（単一ファイル）
- 合計: 565行

### After
- **LLMモジュール**: 7コンポーネント（平均60行）
- **MARLモジュール**: 8コンポーネント（平均50行）
- **共通コンポーネント**: 4コンポーネント
- **UIコンポーネント**: 5コンポーネント

### メリット
✅ コードの可読性向上  
✅ コンポーネントの再利用性向上  
✅ テストが容易  
✅ メンテナンス性向上  
✅ チーム開発がしやすい  


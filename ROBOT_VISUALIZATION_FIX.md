# ロボット可視化のパラメータ同期修正

## 🐛 問題

**LLMタブでロボット数やSensing半径を変更しても、MARLタブの可視化が更新されない**

- ロボット数（`n_robot`）の変更が反映されない
- Sensing半径（`r_sense`）の変更が反映されない
- Avoidance半径（`r_avoid`）の変更が反映されない

---

## ✅ 修正内容

### 1. RobotVisualizationコンポーネントの修正

**ファイル**: `frontend/src/components/features/marl/RobotVisualization.tsx`

#### プロパティに`nRobot`を追加

```typescript
interface RobotVisualizationProps {
  shape?: string
  robots?: Robot[]
  trajectories?: RobotTrajectory[]
  rSense?: number
  rAvoid?: number
  nRobot?: number  // ← 追加：ロボット数（サンプル生成用）
  width?: number
  height?: number
  gridSize?: number
  showTrajectories?: boolean
}
```

#### サンプルロボット生成を動的に

```typescript
// Before（固定）
const sampleRobots: Robot[] = Array.from({ length: 30 }, ...)

// After（動的）
const sampleRobots: Robot[] = Array.from({ length: nRobot }, ...)
```

#### useEffectの依存配列に`nRobot`を追加

```typescript
useEffect(() => {
  // レンダリング処理
}, [shape, robots, trajectories, showTrajectories, rSense, rAvoid, nRobot, width, height, gridSize])
//                                                                  ^^^^^^^^ 追加
```

#### デバッグログを追加

```typescript
console.log('🎨 RobotVisualization rendering:', {
  shape,
  nRobot,
  rSense,
  rAvoid,
  sampleRobotsCount: sampleRobots.length
})
```

#### UI表示を改善

```typescript
<div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
  <div className="flex items-center gap-1">
    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
    <span>Robots ({sampleRobots.length})</span>
  </div>
  <div className="flex items-center gap-1">
    <div className="w-3 h-0.5 bg-blue-300"></div>
    <span>Sensing: {rSense}m</span>  {/* ← 追加 */}
  </div>
  <div className="flex items-center gap-1">
    <div className="w-3 h-0.5 bg-red-300"></div>
    <span>Avoid: {rAvoid}m</span>    {/* ← 追加 */}
  </div>
  {/* ... */}
</div>
```

### 2. MARLModuleRefactoredの修正

**ファイル**: `frontend/src/components/features/marl/MARLModuleRefactored.tsx`

#### `nRobot`プロパティを渡すように修正

```typescript
<RobotVisualization
  shape={episodeConfig.shape || 'circle'}
  robots={robots}
  trajectories={trajectories}
  rSense={episodeConfig.r_sense || 0.4}
  rAvoid={episodeConfig.r_avoid || 0.1}
  nRobot={episodeConfig.n_robot || 30}  // ← 追加
  gridSize={episodeConfig.grid_size || 64}
  showTrajectories={true}
/>
```

---

## 🔄 動作フロー

```
LLMタブでパラメータ変更
   ↓
useLLMStore.setRequest({ n_robot: 50, r_sense: 0.6, ... })
   ↓
useLLMStore.subscribe() が発火
   ↓
MARLタブ: setEpisodeConfig({ n_robot: 50, r_sense: 0.6, ... })
   ↓
RobotVisualization の props が更新
   ↓
useEffect が発火（nRobot, rSense, rAvoid が依存配列に含まれる）
   ↓
サンプルロボットを再生成（50台）
   ↓
Sensing半径を再描画（0.6m）
   ↓
Avoidance半径を再描画（0.1m）
   ↓
UI表示を更新（"Robots (50)", "Sensing: 0.6m"）
```

---

## 🧪 テスト方法

### 1. ロボット数の変更

1. **LLMタブでRobots数を変更**
   - 30 → 50 に変更

2. **MARLタブを確認**
   - 青いドットが50個表示される ✅
   - 下部に "Robots (50)" と表示される ✅
   - コンソール: `🎨 RobotVisualization rendering: { nRobot: 50, ... }`

### 2. Sensing半径の変更

1. **LLMタブでSensing半径を変更**
   - 0.4 → 0.6 に変更

2. **MARLタブを確認**
   - 青いドットの周りの薄い青い円が大きくなる ✅
   - 下部に "Sensing: 0.6m" と表示される ✅
   - コンソール: `🎨 RobotVisualization rendering: { rSense: 0.6, ... }`

### 3. Avoidance半径の変更

1. **LLMタブでAvoidance半径を変更**
   - 0.1 → 0.15 に変更

2. **MARLタブを確認**
   - 衝突判定の閾値が変わる（見た目では分からないが内部で更新）✅
   - 下部に "Avoid: 0.15m" と表示される ✅
   - コンソール: `🎨 RobotVisualization rendering: { rAvoid: 0.15, ... }`

### 4. 複数パラメータの同時変更

1. **LLMタブで複数パラメータを変更**
   - Shape: Circle → Square
   - Robots: 30 → 50
   - Sensing: 0.4 → 0.6
   - Avoidance: 0.1 → 0.15

2. **MARLタブを確認**
   - 形状が正方形に変わる ✅
   - ロボットが50個表示される ✅
   - Sensing半径が大きくなる ✅
   - すべての表示が更新される ✅

---

## 📊 コンソールログ例

### パラメータ変更時

```
🎨 LLM config changed → updating MARL tab: {
  shape: "square",
  n_robot: 50,
  r_sense: 0.6,
  r_avoid: 0.15,
  n_hn: 8,
  n_hc: 100
}
🎨 UI updated: shape = square
🎨 RobotVisualization rendering: {
  shape: "square",
  nRobot: 50,
  rSense: 0.6,
  rAvoid: 0.15,
  sampleRobotsCount: 50
}
```

---

## 🎯 修正のポイント

### 1. **依存配列の完全性**
```typescript
// すべてのパラメータを依存配列に含める
}, [shape, robots, trajectories, showTrajectories, rSense, rAvoid, nRobot, width, height, gridSize])
```

### 2. **動的なサンプル生成**
```typescript
// ロボット数を動的に変更
Array.from({ length: nRobot }, ...)
```

### 3. **リアルタイム同期**
```typescript
// LLMタブの変更を即座に検知
useLLMStore.subscribe((state) => {
  setEpisodeConfig({ n_robot: state.request.n_robot, ... })
})
```

### 4. **視覚的フィードバック**
```typescript
// パラメータの値をUIに表示
<span>Robots ({sampleRobots.length})</span>
<span>Sensing: {rSense}m</span>
<span>Avoid: {rAvoid}m</span>
```

---

## 🎉 完了！

**LLMタブで変更したすべてのパラメータが、MARLタブの可視化に即座に反映されます！**

- ✅ **ロボット数**: 30 → 50 に変更すると即座に50個表示
- ✅ **Sensing半径**: 0.4 → 0.6 に変更すると即座に円が大きくなる
- ✅ **Avoidance半径**: 0.1 → 0.15 に変更すると即座に内部計算が更新
- ✅ **UI表示**: 下部に現在のパラメータ値が表示される
- ✅ **デバッグ**: コンソールでパラメータの変更を確認可能

完璧なリアルタイム同期！ 🚀

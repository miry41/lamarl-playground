import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui'
import { generateShapeCells } from '@/utils/shapeGenerator'

interface Robot {
  x: number
  y: number
  vx?: number
  vy?: number
  id?: number
}

interface RobotTrajectory {
  positions: Array<{ x: number; y: number; step: number }>
  maxLength: number
}

interface RobotVisualizationProps {
  shape?: string
  robots?: Robot[]
  trajectories?: RobotTrajectory[]
  rSense?: number
  rAvoid?: number
  width?: number
  height?: number
  gridSize?: number  // バックエンドのgrid_size（デフォルト64）
  showTrajectories?: boolean  // 軌跡表示のトグル
}

export default function RobotVisualization({
  shape = 'circle',
  robots = [],
  trajectories = [],
  rSense = 0.4,
  rAvoid = 0.1,
  width = 600,
  height = 600,
  gridSize = 64,
  showTrajectories = true,
}: RobotVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate sample robots if none provided
  const sampleRobots: Robot[] =
    robots.length > 0
      ? robots
      : Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * gridSize,
          y: Math.random() * gridSize,
          vx: 0,
          vy: 0,
        }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // グリッド描画設定
    const cellSize = Math.min(width, height) / gridSize
    const offsetX = (width - gridSize * cellSize) / 2
    const offsetY = (height - gridSize * cellSize) / 2

    // Draw target shape cells (gray)
    const targetCells = generateShapeCells(shape, gridSize)
    ctx.fillStyle = '#d1d5db'
    targetCells.forEach((cell) => {
      ctx.fillRect(
        offsetX + cell.x * cellSize,
        offsetY + cell.y * cellSize,
        cellSize,
        cellSize
      )
    })

    // Draw grid lines (間引いて表示: gridSizeが大きい場合は適度に)
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5
    const gridStep = Math.max(1, Math.floor(gridSize / 20))  // 最大20本程度に間引き
    for (let i = 0; i <= gridSize; i += gridStep) {
      ctx.beginPath()
      ctx.moveTo(offsetX + i * cellSize, offsetY)
      ctx.lineTo(offsetX + i * cellSize, offsetY + gridSize * cellSize)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(offsetX, offsetY + i * cellSize)
      ctx.lineTo(offsetX + gridSize * cellSize, offsetY + i * cellSize)
      ctx.stroke()
    }

    // Check collisions (rAvoid は物理単位mなので、グリッド座標に変換)
    // バックエンドのスケーリング: thr = max(1.0, 2*r_avoid * grid_size/16)
    const collisionThreshold = Math.max(1.0, 2 * rAvoid * gridSize / 16)
    const collisions: Array<[Robot, Robot]> = []
    for (let i = 0; i < sampleRobots.length; i++) {
      for (let j = i + 1; j < sampleRobots.length; j++) {
        const dx = sampleRobots[i].x - sampleRobots[j].x
        const dy = sampleRobots[i].y - sampleRobots[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < collisionThreshold) {
          collisions.push([sampleRobots[i], sampleRobots[j]])
        }
      }
    }

    // Draw trajectories (軌跡を描画 - パフォーマンス最適化版)
    if (showTrajectories && trajectories.length > 0) {
      ctx.lineWidth = 1.5
      // 全軌跡をまとめて描画（パフォーマンス向上）
      trajectories.forEach((trajectory) => {
        if (trajectory.positions.length < 2) return

        // パス全体を一度に構築
        ctx.beginPath()
        const firstPos = trajectory.positions[0]
        ctx.moveTo(
          offsetX + firstPos.x * cellSize,
          offsetY + firstPos.y * cellSize
        )
        
        for (let i = 1; i < trajectory.positions.length; i++) {
          const pos = trajectory.positions[i]
          ctx.lineTo(
            offsetX + pos.x * cellSize,
            offsetY + pos.y * cellSize
          )
        }
        
        // 半透明の青で描画
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
        ctx.stroke()
      })
    }

    // Draw collision lines (red)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    collisions.forEach(([robot1, robot2]) => {
      ctx.beginPath()
      ctx.moveTo(
        offsetX + robot1.x * cellSize,
        offsetY + robot1.y * cellSize
      )
      ctx.lineTo(
        offsetX + robot2.x * cellSize,
        offsetY + robot2.y * cellSize
      )
      ctx.stroke()
    })

    // Draw robots
    sampleRobots.forEach((robot) => {
      const x = offsetX + robot.x * cellSize
      const y = offsetY + robot.y * cellSize

      // Draw sensing radius (light circle)
      // rSense は物理単位mなので、グリッド座標に変換（バックエンド: rs * grid_size/8）
      const senseRadius = rSense * gridSize / 8 * cellSize
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)'
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, senseRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Draw robot (blue dot)
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)  // 小さめのドット
      ctx.fill()
    })
  }, [shape, robots, trajectories, showTrajectories, rSense, rAvoid, width, height, gridSize])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">🤖 Robot Formation</h3>
          <div className="text-xs text-muted-foreground">
            Shape: <span className="font-mono font-semibold">{shape.toUpperCase()}</span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full border border-border rounded"
        />
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Robots ({sampleRobots.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Target Shape</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span>Collisions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

